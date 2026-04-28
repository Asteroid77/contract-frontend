Status: historical
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# Layout & Router 架构评估报告

> 本报告记录了 2026-02 初的一次架构评估。其中多项改进建议已在后续路由重构中落地，
> 详见 `docs/reports/refactors/router-architecture-refactor.md`。

## 符合最佳实践的部分

### 1. 架构设计
- DDD 分层架构 — 严格遵循领域驱动设计
- 守卫职责分离 — LoadingBar → Auth → Ability 顺序合理
- 元数据驱动 — 使用 `meta.requiresAuth` 而非正则匹配
- 可观测性集成 — 权限拒绝自动追踪到 SigNoz

### 2. 代码质量
- 常量管理 — `STORAGE_KEYS` 避免魔法字符串
- 类型安全 — 完整的 TypeScript 类型定义
- 错误处理 — 使用 `captureError` 替代 console.error
- 权限检查 — 逻辑正确，返回 boolean

### 3. 权限系统
- 双重系统 — 旧的 permissions/roles + CASL 并存
- 自动同步 — 登录/登出时自动更新 CASL ability
- 细粒度控制 — 支持 action + subject 组合

---

## 当时发现的问题与后续处理

### 1. 路由 URL 结构不友好（已修复）

当时 URL 为 `/auth/dashboard`、`/unauth/login`，暴露了内部布局结构。

**已在路由重构中扁平化为** `/dashboard`、`/login` 等。

### 2. Layout 嵌套层级过深（已修复）

当时为 3 层嵌套（LayoutView → AuthLayoutView → Page）。

**已改为动态 Layout 切换方案**，减少为 2 层。

### 3. 缺少 403/404 错误页面（已修复）

当时 `SetupAuthGuard` 引用了 `{ name: '403' }` 但没有定义对应路由。

**已新增完整的 403/404/500 错误页面。**

### 4. 权限检查可能重复（已修复）

当时两个守卫（AuthGuard + AbilityGuard）可能对同一路由重复检查权限。

**已通过守卫职责拆分解决**：AuthGuard 只负责认证，AbilityGuard 只负责 CASL 授权。

### 5. AuthLayoutView 条件渲染不够优雅（低优先级，暂保留）

`component :is` 在原生元素和组件之间动态切换的写法仍然存在，但影响较小，暂未调整。

### 6. 缺少加载状态（已修复）

已在 LayoutView 中增加全局加载状态，覆盖首次访问需认证页面的场景。

---

## 总结

评估时架构基础扎实（DDD 分层、类型安全、可观测性集成），主要问题集中在 URL 设计和 Layout 嵌套。
这些问题在后续路由重构中均已解决。
