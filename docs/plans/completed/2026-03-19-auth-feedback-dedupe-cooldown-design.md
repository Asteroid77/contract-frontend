Status: completed
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# 401/403 Auth Feedback Dedupe + Cooldown Design

## 背景

当前 `request-auth-feedback.ts` 对 `401/403` 的提示 key 采用：

- `status`
- `code`
- `requestId`
- `message`

这意味着它的去重粒度是“请求级”，而不是“根因级”。

结果是：

- 多个接口同时触发 `403` 时，由于 `requestId` 不同，通常会弹出多个提示
- 同一个根因在短时间内重复出现时，只要上一个通知已关闭，就会再次提示

这会造成典型的提示风暴，尤其在页面初始化阶段多个 query 并发失败时更明显。

---

## 本轮目标

本轮只收口 `401/403` 的 dedupe 与 cooldown，不改 Query 通用错误层，不引入 banner / page-level feedback。

目标是：

1. 多个并发 `401` 只提示一次
2. 多个并发 `403` 只在同一语义范围内提示一次
3. 相同 auth 错误在短时间内重复出现时进入 cooldown，不反复打扰用户
4. 保持当前模块职责不变：
   - `request-auth-feedback.ts` 仍只负责提示策略
   - `auth-session-recovery.ts` 仍只负责最终 `401` 的 session 恢复

---

## 方案比较

### 方案 A：继续使用 requestId 级 key，仅延长通知 duration

优点：

- 改动最小

缺点：

- 无法解决并发多个 `403` 的多次提示
- 只是让用户更久地看到噪音，不是真正降噪

结论：不采用。

### 方案 B：把 dedupe/cooldown 放进通用 discrete api

优点：

- 基础设施层可复用

缺点：

- 本轮只想收口 `401/403`
- 一旦在 primitive 层扩展 cooldown，会把 Query 全局错误层一起卷进来，范围扩大

结论：这轮不采用。

### 方案 C：仅在 `request-auth-feedback.ts` 做 cause-level dedupe + cooldown

优点：

- 范围最小
- 不影响 Query 全局错误层
- 最符合本轮目标

缺点：

- cooldown 暂时只服务 auth feedback，不具备通用复用能力

结论：采用。

---

## 最终设计

### 1. key 规则调整

`401` 改为固定根因 key：

- `auth:401:session-expired`

理由：

- 对用户而言，多个并发 `401` 的语义是同一个：登录态失效
- 不需要按 requestId 区分

`403` 改为 scope 级 key：

- 优先：`auth:403:code:<code>`
- 兜底：`auth:403:forbidden`

本轮不引入 routeName / featureScope 作为额外上下文，保持最小实现。

### 2. cooldown 策略

在 `request-auth-feedback.ts` 内维护最近一次提示时间：

- `401` cooldown：`15000ms`
- `403` cooldown：`5000ms`

行为：

- 如果当前时间仍在 cooldown 窗口内，则不再调用 `showUniqueErrorNotification`
- cooldown 在通知显示期间和通知关闭后都有效

### 3. 职责边界

- `showUniqueErrorNotification(...)`：仍只负责“当前显示中的通知去重”
- `request-auth-feedback.ts`：负责 auth cause-level dedupe + cooldown
- `auth-session-recovery.ts`：不变

---

## 测试策略

新增 / 调整 `request-auth-feedback.spec.ts`：

1. `401` key 不再包含 requestId
2. `403` key 不再包含 requestId
3. cooldown 内重复调用只提示一次
4. cooldown 过后再次调用可重新提示
5. 不同 auth 根因之间互不影响

---

## 风险与控制

### 风险 1：403 粒度过粗

如果不同业务 `403` 共用同一 code，本轮会被合并提示。

这是有意的最小取舍。因为本轮目标是先降噪，而不是引入更复杂的 featureScope 体系。

### 风险 2：测试依赖时间

通过 `vi.useFakeTimers()` 控制 cooldown，避免不稳定。

---

## 预期效果

改完后：

- 页面初始化阶段多个 `403` 并发失败，不再连续弹多个权限提示
- session 失效时多个 `401` 并发失败，只提示一次“登录失效”
- 短时间内重复进入同类 auth 错误，不会持续打扰用户
