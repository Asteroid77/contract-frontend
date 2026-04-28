Status: historical
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# 路由架构重构完成报告

**日期**: 2026-02-06
**状态**: 已完成，构建通过

---

## URL 结构变化

| 页面 | 旧 URL | 新 URL |
|------|--------|--------|
| 仪表盘 | `/auth/dashboard` | `/dashboard` |
| 用户列表 | `/auth/users` | `/users` |
| 登录页 | `/unauth/login` | `/login` |
| 注册页 | `/unauth/register` | `/register` |
| 业务管理 | `/auth/business` | `/business` |

## 架构改进

### 1. Layout 嵌套层级优化

之前（3 层嵌套）：

```
LayoutView (/)
  └─ UnauthLayoutView (/unauth)
      └─ LoginView (/unauth/login)
  └─ AuthLayoutView (/auth)
      └─ DashboardView (/auth/dashboard)
```

现在（2 层嵌套）：

```
LayoutView (/)
  └─ LoginView (/login)          [动态切换 UnauthLayout]
  └─ DashboardView (/dashboard)  [动态切换 AuthLayout]
```

### 2. 路由守卫职责分离

之前 `SetupAuthGuard` 承担认证 + 权限 + 角色 + 数据加载全部职责。

现在拆分为：

- `SetupAuthGuard` — 只负责认证检查、数据加载、登录重定向
- `SetupAbilityGuard` — 只负责 CASL 权限检查

### 3. 权限系统升级

从简单的字符串数组 `permissions: ['user:create']` 升级为 CASL 细粒度控制：

```typescript
meta: {
  ability: { action: 'create', subject: 'User' }
}
```

模板中可使用指令：

```vue
<n-button v-can="'create:User'">创建用户</n-button>
```

---

## 新增功能

### 错误页面

新增 `/403`、`/404`、`/500` 错误页面，统一视觉风格，提供返回上一页/首页按钮。

### 全局加载状态

用户已登录但数据未加载完成时显示全局 loading，避免空白屏幕。

### CASL 权限系统

核心文件：

- `src/modules/access/application/ability.ts` — 权限核心
- `src/modules/access/application/hooks/useCan.ts` — 组合式函数
- `src/modules/access/presentation/directives/can.ts` — v-can 指令
- `src/router/guards/SetupAbilityGuard.ts` — 路由守卫

---

## 路由元数据

```typescript
interface AppRouteMeta {
  name?: string
  icon?: string
  requiresAuth?: boolean     // 默认 true
  layout?: 'auth' | 'unauth'
  hideInMenu?: boolean
  permissions?: string[]     // 旧方式（兼容）
  roles?: string[]           // 旧方式（兼容）
  ability?: AbilityRule      // 新方式（推荐）
}
```

### 动态布局切换

```typescript
const currentLayout = computed(() => {
  const layout = route.meta.layout as 'auth' | 'unauth' | undefined
  if (layout === 'unauth') return UnauthLayoutView
  if (layout === 'auth') return AuthLayoutView
  const requiresAuth = route.meta.requiresAuth !== false
  return requiresAuth ? AuthLayoutView : UnauthLayoutView
})
```

### 守卫执行顺序

```typescript
export function setupGuards(router: Router) {
  setupLoadingBarGuards(router)  // 1. 加载条
  setupAuthGuards(router)         // 2. 认证检查
  setupAbilityGuard(router)       // 3. 权限检查
}
```

---

## 迁移影响

- **路由跳转**：无需修改，路由名称不变（`router.push({ name: 'dashboard' })`）
- **路由链接**：无需修改，基于路由名称的链接自动适配
- **菜单构建**：无需修改，`convertRoutesToMenuItems` 基于路由名称
- **权限检查**：可选升级到 CASL `ability` 方式，旧 `permissions` 方式仍兼容

---

## 验证结果

- TypeScript 类型检查通过
- Vite 构建成功
- 功能测试：未登录重定向、已登录跳转、404/403 页面、权限控制、菜单渲染均正常

---

## 相关文档

- 架构评估报告：`docs/reports/architecture/layout-router-review.md`
- CASL 集成指南：`docs/how-to/modules/access/casl-integration.md`
