# Access 模块

认证令牌管理与 RBAC 权限控制模块。为应用提供 token 生命周期管理和基于 CASL 的细粒度权限检查。

## 目录结构

```
access/
├── domain/                      # 领域类型
│   ├── types.ts                 # Permission, RoleVo, AssignedUserOptions
│   └── dto.ts                   # 角色/权限请求 DTO
├── application/                 # 应用层
│   ├── ability.ts               # CASL Ability 核心（规则解析、全局实例、Action/Subject 定义）
│   ├── token-manager.ts         # Token 存取、自动刷新、跨 tab 锁协调、失败退避
│   ├── service.ts               # 角色/权限 CRUD 应用服务
│   ├── models.ts                # 应用层视图模型与查询参数类型
│   ├── validation.ts            # 登录、注册、找回密码表单校验规则
│   └── hooks/                   # Vue 组合式函数
│       ├── useCan.ts            # 响应式权限检查（can/cannot/usePermission）
│       ├── useRoleService.ts    # 角色分页、编辑（vue-query）
│       └── useUserRoleService.ts # 用户-角色分配查询与变更
├── infrastructure/              # 基础设施
│   ├── access-repository.ts     # 角色/权限/用户角色 HTTP 调用
│   └── auth-endpoints.ts        # 认证 endpoint 路径常量
└── presentation/                # 表现层
    ├── directives/can.ts        # v-can 权限指令（支持 AND/OR）
    └── role/                    # 角色管理页面
        ├── RolePage.vue
        └── RoleAssign.vue
```

## 主要能力

### 权限检查

基于 CASL 的权限系统，支持三种使用方式：

- **命令式**：`can('create', 'User')` / `cannot('delete', 'Contract')`
- **响应式**：`usePermission('read', 'Dashboard')` 返回 `ComputedRef<boolean>`
- **模板指令**：`v-can="'create:User'"` 或 `v-can:any="['read:Contract', 'update:Contract']"`

权限规则从后端 `subject:action` 格式的字符串自动解析，支持别名映射（`view` -> `read`、`edit` -> `update`、`*` -> `manage`）。管理员角色（`admin` / `super_admin`）自动获得全部权限。

### Token 生命周期

`token-manager` 管理 access token 和 refresh token 的完整生命周期：

- localStorage 持久化存储
- 过期前主动刷新（可配置提前量）
- 跨浏览器 tab 的刷新锁（防止并发刷新）
- 刷新失败后指数退避
- 登出时清理所有状态并广播事件

### 角色与权限管理

通过 vue-query hooks 提供角色和权限的 CRUD 操作：

- `useRolePage` / `useRolesByUserId`：角色分页查询
- `useEditRole`：角色编辑（自动失效缓存）
- `useAssignedUsersByRole` / `useAssignRoleToUsers`：用户-角色分配

## 使用方式

```typescript
// 权限检查（命令式）
import { can, cannot } from '@/modules/access'
if (can('create', 'Contract')) {
  /* ... */
}

// 权限检查（组合式函数）
import { usePermission, useAnyPermission } from '@/modules/access'
const canEdit = usePermission('update', 'Contract')
const canManageUser = useAnyPermission([
  ['create', 'User'],
  ['update', 'User'],
])

// 模板指令
import { canDirective } from '@/modules/access'
// 注册后在模板中使用：
// <button v-can="'create:Contract'">新建合同</button>

// 权限初始化（登录后调用）
import { updateAbility, clearAbility } from '@/modules/access'
updateAbility(permissions, roles) // 登录时
clearAbility() // 登出时

// Token 管理
import {
  setAuthTokens,
  clearAuthTokens,
  initAuthTokenLifecycle,
} from '@/modules/access/application/token-manager'
initAuthTokenLifecycle() // 应用启动时
setAuthTokens({ accessToken, refreshToken, expiresIn }) // 登录成功后

// 角色服务
import { useRolePage, useEditRole } from '@/modules/access/application/hooks/useRoleService'
const { data, isLoading } = useRolePage(params)
```

## 注意事项

- `token-manager` 被 `shared/infrastructure/useRequest` 直接引用，修改时需评估对全局请求流程的影响。
- 扩展 `Subject` 或 `Action` 类型时，需同步更新 `ability.ts` 中的别名映射表和验证函数。
- `validation.ts` 存在对 `@/modules/user` 表单类型的依赖，这是已知的跨模块耦合。
