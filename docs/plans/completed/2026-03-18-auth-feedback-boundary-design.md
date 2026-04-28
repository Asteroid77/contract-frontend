Status: completed
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# 401/403 鉴权提示边界调整设计

**日期**: 2026-03-18  
**适用范围**: `src/modules/shared/infrastructure/useRequest.ts`、`src/modules/access/application/token-manager.ts`、`src/app/plugins/useRequestPlugin.ts`  
**目标读者**: 已熟悉当前仓库分层和 TanStack Query / Axios 基础的维护者

## 背景

当前仓库的请求链路已经分成两层：

1. `useRequest.ts` / `token-manager.ts`
   - requestId 注入
   - token 注入
   - 401 -> refresh -> replay
   - BusinessError 映射
2. `useRequestPlugin.ts`
   - query retry
   - QueryCache / MutationCache 全局 success/error toast
   - `meta.skipGlobalErrorHandler`
   - `meta.toastOnError` / `meta.toastOnSuccess`

现状问题不在于“功能失效”，而在于 **401/403 的用户提示语义目前还留在 Query 层兜底**，这和认证链路的真实归属不一致。

具体说：

- 401 / 403 的识别与处理前置条件，实际上依赖 `useRequest` 的 refresh/replay 最终结果
- Query 插件更适合处理 query/mutation 生命周期相关的反馈，不适合承接最终的鉴权类提示
- 如果把这类提示继续留在 Query 层，职责边界会继续混在一起

## 目标

- 把 **401/403 的最终用户提示** 收敛到 Axios / 统一请求封装侧
- 保持 `useRequestPlugin.ts` 只负责 Query 生命周期相关反馈
- 不改变现有 refresh、requestId、BusinessError 映射与 Query retry 逻辑
- 不把用户提示直接塞进 raw interceptor，避免影响第三方 Axios 扩展使用方式

## 非目标

- 不重写 `apiClient` 为全量拦截器驱动架构
- 不改动 refresh token 生命周期实现
- 不改变路由守卫、登出流程和权限页跳转逻辑
- 不把所有错误提示都迁出 Query 层；本次只处理 401/403 鉴权/权限类提示

## 现状归因

### 为什么不是直接写在 Axios interceptor

直接写在 raw interceptor 的问题有两个：

1. interceptor 看到的是单次 HTTP 响应，不天然掌握 `useRequest` 中 refresh/replay 的最终语义
2. 当前项目已经有统一请求入口 `useRequest(...)`，再把鉴权提示塞进 interceptor，会把 transport 行为和应用侧反馈重新绑死

在当前仓库里，interceptor 更适合做：

- 统一 header
- transport 级错误预处理
- 第三方插件扩展点

而不是承接最终的用户可见 auth feedback。

### 为什么要放回 `useRequest` 侧

`useRequest(...)` 已经掌握：

- 初次请求失败
- 是否命中 refresh 条件
- refresh 是否成功
- replay 是否成功
- 最终抛出的是否是鉴权类 `BusinessError`

所以对 401/403 来说，**只有 `useRequest` 这一层知道什么时候才算“最终失败，需要提示用户”**。

这也是把鉴权提示放回请求封装层的根本理由。

## 备选方案

### 方案 A：直接在 `apiClient` response interceptor 中处理 401/403

**结论**：不采用。

原因：

- 和 refresh/replay 语义分离
- 容易提前提示
- 会让 raw Axios 实例承担过多用户态职责

### 方案 B：新增独立 auth feedback 模块，由 `useRequest.ts` 在最终失败时调用

**结论**：采用。

建议新增：

- `src/modules/shared/infrastructure/request-auth-feedback.ts`

职责只做：

- 识别最终抛出的 auth / permission 错误
- 发统一提示
- 提供去重策略

`useRequest.ts` 负责在 refresh/replay 彻底失败后调用它。  
`useRequestPlugin.ts` 不再承担 401/403 默认提示。

### 方案 C：interceptor 打标，`useRequest` 再解释标记

**结论**：本次不采用。

原因：

- 对当前仓库来说过重
- 会增加一层中间协议
- 收益不足

## 采用方案

采用 **方案 B**，并按下列职责边界实施。

## 2026-03-19：已落地状态

- 已新增 `src/modules/shared/infrastructure/request-auth-feedback.ts`
- 已在 `src/modules/shared/infrastructure/useRequest.ts` 的最终失败分支接入 auth feedback
- 已确认：
  - `401` refresh 成功时不提示 auth feedback
  - `401` refresh 最终失败时由 request 侧提示
  - `403` 由 request 侧提示
- 已从 `src/app/plugins/useRequestPlugin.ts` 移除 `403` 的默认 Query 层兜底提示
- 已通过回归测试：
  - `src/modules/shared/infrastructure/__tests__/request-auth-feedback.spec.ts`
  - `src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts`
  - `src/app/plugins/__tests__/useRequestPlugin.spec.ts`

## 目标职责边界

### `http-client.ts`

只保留 Axios client 创建与 transport 基础配置。

### `token-manager.ts`

继续只负责：

- token 生命周期
- refresh promise 复用
- refresh lock
- refresh 失败冷却

不增加 toast 或 UI 行为。

### `request-auth-feedback.ts`（新增）

负责：

- 判断错误是否属于 401/403 鉴权/权限类失败
- 产出用户可见通知
- 做通知去重

它不负责：

- token 刷新
- BusinessError 构造
- query retry

### `useRequest.ts`

继续作为统一请求编排层，并新增：

- 在最终失败分支调用 `request-auth-feedback`

调用时机必须满足：

- 初次请求已失败
- 若命中 refresh，则 refresh/replay 已完成
- 最终即将抛出 `BusinessError`

也就是说，**只在最终失败时提示**。

### `useRequestPlugin.ts`

继续负责：

- query retry
- QueryCache / MutationCache 的全局 success/error toast
- `meta` 驱动的 query/mutation 级别行为

明确移除：

- 401/403 的默认全局提示职责

保留：

- 非 auth 类 query/mutation 错误提示
- query 有旧缓存数据时的后台刷新失败提示
- 业务 error toast

## 预期行为

### 401 且 refresh 成功

- 不提示 auth error
- 直接 replay 原请求
- 业务侧无感

### 401 且 refresh 最终失败

- 由 `useRequest` 侧 auth feedback 统一提示
- 最终错误继续抛出

### 403

- 不再依赖 Query 层默认兜底提示
- 由 request 侧 auth feedback 统一提示

### 其它 4xx / 5xx / 网络错误

- 继续由 `useRequestPlugin.ts` 根据 Query / Mutation 生命周期处理

## 测试策略

本次改造按 TDD 做，测试重点放在两个层面。

### 1. `useRequest` 侧

新增或补充测试验证：

- refresh 成功时不触发 auth feedback
- refresh 失败且最终为 401 时触发 auth feedback
- 403 响应直接触发 auth feedback
- requestId、BusinessError 映射和现有 replay 行为不回归

### 2. Query 插件侧

调整 `useRequestPlugin.spec.ts` 验证：

- Query 默认错误提示不再负责 403 兜底
- 现有 query retry / success toast / skipGlobalErrorHandler 不变

## 风险与控制

### 风险 1：401 被提示两次

**控制**：

- Query 层移除 401/403 默认提示职责
- request 侧新增 auth feedback 去重策略

### 风险 2：403 既被请求层提示，又被页面或守卫单独处理

**控制**：

- 本次只调整“默认全局提示”
- 页面级、守卫级的业务化处理先不动，但需要在文档里明确这是不同层级行为

### 风险 3：把 auth feedback 直接耦合回 `token-manager`

**控制**：

- 明确禁止在 `token-manager.ts` 中放 UI 通知逻辑
- 反馈模块单独建文件，由 `useRequest.ts` 调用

## 改造后的工程判断

改造完成后，这条链路的职责会更干净：

- `http-client.ts`：transport client
- `token-manager.ts`：token 生命周期与并发刷新
- `useRequest.ts`：统一请求编排与最终 auth feedback 触发点
- `request-auth-feedback.ts`：鉴权/权限类用户提示
- `useRequestPlugin.ts`：Query 生命周期反馈

这个边界比“全塞进 interceptor”更符合当前仓库结构，也更便于第三方 Axios 扩展共存。
