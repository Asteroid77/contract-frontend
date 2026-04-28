Status: active
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# 请求认证、刷新与 Query 反馈链路说明

## 目标

这份文档只服务于已经具备前端工程基础、需要维护当前请求链路的人。

目标不是解释 Axios、TanStack Query 或 JWT 的基础概念，而是把当前仓库里这条链路一次性说明白，便于：

- 快速恢复上下文
- 反查实现文件
- 修改时知道影响面
- 分享当前实现细节

---

## 适用范围

当前链路由以下文件共同组成：

- `src/app/infrastructure/request/http-client.ts`
- `src/modules/shared/infrastructure/useRequest.ts`
- `src/modules/shared/infrastructure/request-auth-feedback.ts`
- `src/modules/access/application/auth-session-recovery.ts`
- `src/modules/access/application/token-manager.ts`
- `src/app/plugins/useRequestPlugin.ts`
- `src/modules/shared/domain/errors.ts`

相关测试主要位于：

- `src/modules/shared/infrastructure/__tests__/useRequest.request-id.spec.ts`
- `src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts`
- `src/modules/access/application/__tests__/auth-session-recovery.spec.ts`
- `src/modules/access/application/__tests__/token-manager.spec.ts`
- `src/app/plugins/__tests__/useRequestPlugin.spec.ts`

---

## 设计目标

当前实现同时满足几件事：

1. 业务层只走统一请求入口 `useRequest(...)`
2. 所有请求统一注入 `requestId`
3. access token 失效时，优先尝试 refresh token 获取新 token 并重放原请求
4. 并发刷新时不重复发送 refresh 请求
5. 多标签页场景下避免重复 refresh
6. HTTP 错误统一映射为 `BusinessError`
7. Query 层统一处理 retry、全局 success/error toast 和 query requestId 清理
8. 最终 401 失败时统一清理本地 session，并复用既有事件链路跳回登录页

这几个目标分别分布在不同层，不是“逻辑散落”，而是按职责切开：

- Axios 实例层：HTTP client 基础配置
- `useRequest` 层：请求执行、requestId、token 注入、401 refresh/replay、错误映射、最终失败编排
- `token-manager` 层：token 生命周期、refresh 并发控制、跨 tab 锁、失败冷却
- `auth-session-recovery` 层：最终 401 后的 session 清理协同
- Query 插件层：query retry、global toast、meta 控制、query requestId 生命周期

---

## 模块职责

### 1. `http-client.ts`

只负责创建 `apiClient`：

- `baseURL`
- `timeout`
- 默认 `Content-Type`
- `paramsSerializer`

这里不承载认证刷新和业务错误映射逻辑。

### 2. `useRequest.ts`

统一请求入口，当前是这条链路的核心编排层。

负责：

- 注入 `requestId`
- 读取和注入 access token
- 执行实际请求
- 在满足条件时触发 refresh 并重放请求
- 把 Axios response error 映射成 `BusinessError`
- 在最终失败时编排 auth feedback / auth session recovery
- 按 `responseShape` 统一返回 `data / envelope / raw`

### 3. `token-manager.ts`

负责 token 生命周期和 refresh 并发控制。

负责：

- 读写 access token / refresh token
- access token 过期时间计算
- 主动 refresh 调度
- 同 tab refresh promise 复用
- 跨 tab refresh lock
- refresh 失败冷却
- refresh 失败后的 token 清理策略

### 4. `auth-session-recovery.ts`

负责最终认证失败后的 session 恢复动作。

负责：

- 识别是否为“需要恢复 session 的最终 401”
- 判断当前是否仍存在本地 session
- 优先复用 `useAccountStore().clearSession()`
- 在没有 active pinia 时降级为 `clearAuthTokens()`
- 用 in-flight promise 避免并发重复清理

它不负责 toast，不负责 refresh，也不直接做 router 跳转。

### 5. `useRequestPlugin.ts`

负责 Query 侧全局行为。

负责：

- query 默认 retry 规则
- QueryCache / MutationCache 全局 success/error 回调
- 全局 toast
- `meta.skipGlobalErrorHandler`
- `meta.toastOnError`
- `meta.toastOnSuccess`
- `clearQueryRequestId(...)`

### 6. `request-auth-feedback.ts`

负责 request 侧最终鉴权/权限反馈。

负责：

- 识别 `BusinessError.status` 是否为 `401/403`
- 构造 cause-level 去重 key
- 对 auth 提示应用短时间 cooldown
- 通过 `showUniqueErrorNotification(...)` 输出统一提示

它只处理最终失败后的用户反馈，不参与 refresh、retry、session 清理或路由跳转。

---

## 主流程

## 正常请求流程

1. 业务仓储或 service 调用 `useRequest(...)`
2. `useRequest` 通过 `setRequestId(...)` 注入 requestId
3. `executeRequest(...)` 调用 `setToken(...)` 注入 access token
4. 使用 `apiClient(config)` 发请求
5. `resolveResponsePayload(...)` 解包响应
6. 若成功返回，Query 层按 success 逻辑继续处理

这条路径不涉及 refresh。

---

## 401 -> refresh -> replay 流程

入口在 `useRequest(...)`：

1. 首次 `executeRequest(...)` 失败
2. 进入 `catch`
3. 调用 `shouldRetryWithTokenRefresh(error, config)` 判断是否满足 refresh 条件
4. 满足条件后：
   - 标记 `config._authRetried = true`
   - 先执行 `shouldRefreshBeforeRetry(config)`
   - 如果判断“不需要 refresh，只需重放”，则直接带最新 token 重放
   - 否则调用 `await forceRefreshAccessToken()`
5. refresh 成功后再次执行 `executeRequest(..., true)`，强制重新读取 token
6. 若 replay 仍失败，则通过 `throwMappedRequestError(...)` 统一抛出 `BusinessError`

`shouldRetryWithTokenRefresh(...)` 当前判定条件：

- 非 `skipAuthRefresh`
- 当前请求未重试过
- 本地还有 refresh token
- 当前不处于 logout 过程
- 错误是有响应体的 Axios error
- `status === 401` 或后端业务 code 命中 token verify/expired

---

## 最终 401 -> feedback -> session recovery 流程

这条路径只发生在 refresh 已失败，或者请求根本不满足 refresh 条件，但最终错误仍然是可恢复的 401。

1. `useRequest(...)` 进入 `throwMappedRequestError(...)`
2. Axios error 被映射为 `BusinessError`
3. 调用 `request-auth-feedback.ts` 输出默认 401 提示
4. 若命中“可恢复的最终 401”，再调用 `auth-session-recovery.ts`
5. `auth-session-recovery.ts` 优先调用 `useAccountStore().clearSession()`
6. `clearSession()` 内部继续走 `clearAuthTokens()`
7. `clearAuthTokens()` 触发 `AUTH_SESSION_CLEARED_EVENT`
8. router 侧监听该事件并在需要鉴权的页面上跳回 login

这里刻意保持两层分离：

- `request-auth-feedback.ts` 只负责“告诉用户发生了什么”
- `auth-session-recovery.ts` 只负责“系统接下来怎么恢复”

`403` 不走这条路径，只提示，不清 session。

---

## 旧 token 并发 401 优化

这个优化点在 `shouldRefreshBeforeRetry(config)`。

场景：

- 请求 A 带旧 token 发出
- 请求 B 更早一步完成了 refresh，并把新 token 写回本地
- 请求 A 返回 401

如果此时请求 A 再去 refresh 一次，会导致重复 refresh。

当前实现会比较：

- 本次请求真正使用过的 token：`config._authTokenUsed`
- 当前本地存储里的最新 token：`getStoredAccessToken()`

如果发现：

- 本次请求使用的是旧 token
- 本地已经存在更新后的新 token

则 **不再 refresh**，直接重放原请求。

对应测试：

- `useRequest.request-id.spec.ts`
  - `replays with latest token when first attempt used stale token and skips refresh`

---

## 同 tab 并发 refresh 去重

入口在 `token-manager.ts` 的：

- `let refreshTokenPromise: Promise<AuthTokenPair> | null = null`
- `forceRefreshAccessToken()`

逻辑：

1. 第一个请求调用 `forceRefreshAccessToken()`
2. 若当前 `refreshTokenPromise` 为空，则创建新的 refresh promise
3. 后续同时进来的请求再次调用 `forceRefreshAccessToken()`
4. 由于 `refreshTokenPromise` 已存在，这些请求直接 `return refreshTokenPromise`

结果：

- 同一个 tab / 同一个 JS 上下文内，只会发一次 refresh 请求
- 其它请求等待同一个 promise resolve/reject

对应测试：

- `token-manager.spec.ts`
  - `reuses one refresh request for concurrent refresh calls`

---

## 跨 tab refresh lock

仅做同 tab promise 复用还不够，因为多标签页可能同时撞 401。

当前实现使用 localStorage 锁：

- `REFRESH_LOCK_STORAGE_KEY`
- `tryAcquireRefreshLock(...)`
- `waitForRefreshByOtherTab(...)`
- `releaseRefreshLock(...)`

流程：

1. tab A 尝试 refresh，先抢锁
2. tab B 同时也想 refresh，但发现锁已存在且属于相同 refresh token
3. tab B 不再主动发 refresh 请求，而是进入 `waitForRefreshByOtherTab(...)`
4. tab B 轮询等待：
   - 锁释放
   - token 被其它 tab 更新
5. 若 tab A 已完成 refresh 并写入新 token，tab B 直接复用新 token，不再发 refresh

对应测试：

- `token-manager.spec.ts`
  - `waits for cross-tab refresh lock and reuses tokens without sending duplicate refresh`
  - `reuses latest tokens when another tab has already rotated refresh token`
  - `does not retry stale refresh token after waiting when token was cleared`

---

## refresh 失败后的处理

### 1. 刷新失败但属于网络类失败

当前策略：

- 保留旧 token
- 抛错
- 进入失败冷却，避免 refresh storm

对应测试：

- `keeps old tokens when refresh request fails due network error`
- `blocks rapid repeated refresh attempts after failure to avoid refresh storm`

### 2. 刷新失败且明确是 refresh token 失效

当前策略：

- 清空 token
- 抛错

判定条件见 `shouldClearTokensAfterRefreshFailure(...)`：

- `status === 401 || status === 403`
- 或者后端业务 code 命中 token verify/expired

对应测试：

- `clears tokens when refresh failed with plain 401`
- `clears tokens when refresh failed with token-expired business code`

### 3. 失败冷却

当前实现通过：

- `REFRESH_FAILURE_STATE_STORAGE_KEY`
- `markRefreshFailure(...)`
- `getRefreshBlockedUntil(...)`

做指数退避式冷却。

目的是避免 refresh endpoint 连续失败时，所有请求持续触发 refresh，形成风暴。

对应测试：

- `blocks rapid repeated refresh attempts after failure to avoid refresh storm`
- `respects cross-tab refresh failure cooldown persisted in localStorage`
- `ignores stale cooldown state when refresh token has rotated`

---

## requestId 链路

`useRequest(...)` 是 requestId 的统一入口。

关键点：

- `setRequestId(config)` 会优先从：
  - `config.requestContext.requestId`
  - 当前 request context
  - headers
  - 自动生成
- 然后把 requestId 回填到 headers 和 requestContext
- 响应成功时，`resolveResponsePayload(...)` 会把 response requestId 回填到 envelope
- 响应失败时，`throwMappedRequestError(...)` 会把 response requestId 写入 `BusinessError`

这保证：

- replay 前后 requestId 保持稳定
- Query 层 toast 能把 requestId 带出来

对应测试：

- `useRequest.request-id.spec.ts`
  - `maps failed response requestId to BusinessError`
  - `retries with refreshed token on 401 and keeps same requestId`

---

## Query 层职责

`useRequestPlugin.ts` 负责 Query 侧全局行为，不负责 refresh。

当前职责分工是：

### 1. Query retry

默认 query retry 使用 `shouldRetryQueryError(...)`：

- `CanceledError` 不重试
- `5xx` 与 `408/429` 可重试
- 瞬时网络错误可重试
- 最大重试 2 次

对应测试：

- `query retry does not retry non-retryable 4xx business errors`
- `query retry retries on 5xx errors with max retry count`
- `query retry retries transient network errors`

### 2. Query / Mutation 全局错误提示

通过：

- `QueryCache.onError`
- `MutationCache.onError`

调用 `globalBaseErrorHandler(...)`

支持：

- 默认全局错误提示
- `skipGlobalErrorHandler`
- `toastOnError` 布尔/对象/函数

限制：

- 不再负责 `401/403` 的默认鉴权/权限提示

### 3. Query / Mutation 全局成功提示

通过：

- `QueryCache.onSuccess`
- `MutationCache.onSuccess`

调用 `globalSuccessHandler(...)`

支持：

- success toast 默认关闭
- query / mutation 侧按 `meta.toastOnSuccess` 显式开启（boolean / object / function）

### 4. query requestId 清理

`QueryCache.onSettled` 会执行：

- `clearQueryRequestId(query.queryKey)`

用于清理 query 侧附加的 requestId 状态。

---

## 当前的错误职责边界

当前实现里，建议按下面理解：

### `useRequest` / `token-manager`

负责：

- token 注入
- 401 refresh/replay
- refresh 并发控制
- refresh 锁
- refresh 失败清 token
- Axios error -> `BusinessError`
- 最终失败后的编排

### `request-auth-feedback`

负责：

- 最终失败后的 `401/403` 默认提示
- cause-level 提示去重
- auth feedback cooldown

不负责：

- 清 session
- 跳转

### `auth-session-recovery`

负责：

- 最终 401 的 session 清理
- 复用 `AUTH_SESSION_CLEARED_EVENT` 触发既有重定向链路

不负责：

- toast
- refresh
- router 直接跳转

### `useRequestPlugin`

负责：

- query retry
- 基于 Query/Mutation 生命周期的全局 toast
- `meta` 驱动的局部开关

不再负责：

- `401/403` 的默认鉴权/权限提示

这条边界意味着：

- `useRequest` 处理“传输层/认证层语义”
- `request-auth-feedback` 处理“最终失败后给用户看什么”
- `auth-session-recovery` 处理“最终 401 后系统怎么恢复”
- Query 插件处理“Query 生命周期和用户反馈语义”

---

## 关键实现入口索引

### `useRequest.ts`

- `useRequest(...)`
- `executeRequest(...)`
- `shouldRetryWithTokenRefresh(...)`
- `shouldRefreshBeforeRetry(...)`
- `throwMappedRequestError(...)`
- `resolveResponsePayload(...)`
- `setRequestId(...)`
- `setToken(...)`

### `auth-session-recovery.ts`

- `isRecoverableAuthSessionError(...)`
- `recoverAuthSession(...)`

### `token-manager.ts`

- `forceRefreshAccessToken(...)`
- `refreshAccessTokenIfNeeded(...)`
- `requestRefreshToken(...)`
- `tryAcquireRefreshLock(...)`
- `waitForRefreshByOtherTab(...)`
- `markRefreshFailure(...)`
- `shouldClearTokensAfterRefreshFailure(...)`

### `useRequestPlugin.ts`

- `shouldRetryQueryError(...)`
- `globalBaseErrorHandler(...)`
- `globalMutationErrorHandler(...)`
- `globalSuccessHandler(...)`
- `queryCache`
- `mutationCache`

---

## 测试映射

## `src/modules/shared/infrastructure/__tests__/useRequest.request-id.spec.ts`

重点覆盖：

- requestId 透传
- 401 refresh 后 replay
- replay 过程中 requestId 不变
- 旧 token 并发 401 时直接复用最新 token

## `src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts`

重点覆盖：

- 响应解包
- `BusinessError` 映射
- `responseShape`
- refresh 相关基础行为

## `src/modules/access/application/__tests__/token-manager.spec.ts`

重点覆盖：

- concurrent refresh promise 复用
- refresh token 缺失/失效
- refresh 成功后 token 轮换
- refresh 失败冷却
- 跨 tab 锁等待与 token 复用

## `src/modules/access/application/__tests__/auth-session-recovery.spec.ts`

重点覆盖：

- 仅最终 401 触发 session recovery
- 无本地 session 时不做清理
- 并发 recovery 只执行一次清理

## `src/app/plugins/__tests__/useRequestPlugin.spec.ts`

重点覆盖：

- query retry 规则
- QueryCache / MutationCache 的全局 success/error 行为
- `skipGlobalErrorHandler`
- `toastOnError`
- `toastOnSuccess`
- 401/403 不再由 Query 层兜底提示（由 request 侧 auth feedback 统一处理）

---

## 修改注意事项

### 1. 不要绕开 `useRequest(...)`

如果业务代码直接调用 `apiClient.get(...)`：

- 不会自动获得 requestId 注入
- 不会自动获得 refresh/replay
- 不会统一映射成 `BusinessError`

这会直接破坏当前统一链路。

### 2. 修改 `forceRefreshAccessToken(...)` 前先看并发语义

这里不是简单的“发 refresh 请求”，而是同时承担：

- 同 tab 单飞
- 跨 tab 锁
- 失败冷却
- token 轮换恢复

任何改动都要重新验证这些场景。

### 3. `useRequestPlugin.ts` 里不要混入 refresh 逻辑

Query 层当前只处理：

- retry
- toast
- cache 生命周期

不要在这里再引入 token refresh 或认证恢复，否则职责会重新混在一起。

### 4. `401/403` 的提示策略调整要先确认“谁负责识别，谁负责反馈”

当前实现已经完成收口：

- `useRequest.ts` 在最终失败分支调用 `request-auth-feedback.ts`
- `useRequest.ts` 只在可恢复的最终 401 上调用 `auth-session-recovery.ts`
- `useRequestPlugin.ts` 不再对 `401/403` 做默认兜底提示
- `request-auth-feedback.ts` 已从 requestId 级去重收紧为 cause-level dedupe，并对 `401/403` 增加 cooldown

后续继续调整时仍要遵守一个原则：

- 同一种用户可见反馈只能有一个主处理点

否则会出现：

- Axios 提示一次
- Query 再提示一次
- 页面局部再提示一次

---

## 当前已知不足

这套实现是完整的，但仍有几个需要保持意识的点：

1. `useRequestPlugin.ts` 仍然承担了较多用户提示职责
2. `useRequest` 与 `token-manager` 之间存在历史耦合，改动认证逻辑要全链路回归
3. `auth-session-recovery.ts` 当前只覆盖最终 401 的本地 session 清理；如果后续要支持更复杂的 SSO / 多端登出广播，应继续扩展它，而不是把逻辑塞回 `request-auth-feedback.ts` 或 `token-manager.ts`

---

## 建议的阅读顺序

如果要重新进入这套实现，建议按这个顺序看：

1. `src/modules/shared/infrastructure/useRequest.ts`
2. `src/modules/access/application/token-manager.ts`
3. `src/modules/access/application/auth-session-recovery.ts`
4. `src/modules/shared/infrastructure/__tests__/useRequest.request-id.spec.ts`
5. `src/modules/access/application/__tests__/token-manager.spec.ts`
6. `src/modules/access/application/__tests__/auth-session-recovery.spec.ts`
7. `src/app/plugins/useRequestPlugin.ts`
8. `src/app/plugins/__tests__/useRequestPlugin.spec.ts`

这样最容易把请求执行、refresh 并发控制、最终 401 的 session 恢复，以及 Query 生命周期反馈四段重新接起来。
