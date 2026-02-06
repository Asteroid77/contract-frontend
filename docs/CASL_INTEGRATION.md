# CASL 权限管理系统集成指南

## 📋 概述

本项目已集成 **CASL (Conditional Access Control Library)**，提供细粒度的权限控制能力。

### 架构设计

遵循 **DDD (领域驱动设计)** 架构：

```
src/modules/access/
├── domain/              # 领域层
│   ├── types.ts        # 领域实体（Permission, Role）
│   └── dto.ts          # 数据传输对象
├── application/         # 应用层
│   ├── ability.ts      # CASL 核心逻辑
│   ├── hooks/          # 组合式函数
│   │   └── useCan.ts   # 权限检查 hooks
│   ├── models.ts       # 应用模型
│   └── service.ts      # 应用服务
├── infrastructure/      # 基础设施层
│   └── access-repository.ts
└── presentation/        # 表现层
    ├── directives/     # Vue 指令
    │   └── can.ts      # v-can 指令
    └── role/           # 角色管理组件
```

## 🚀 快速开始

### 1. 权限格式

后端权限格式：`{resource}:{action}`

示例：
- `user:create` - 创建用户
- `contract:read` - 读取合同
- `approval:*` - 审批的所有操作

### 2. 在模板中使用

#### 单个权限检查
```vue
<template>
  <!-- 只有拥有 create:User 权限的用户才能看到此按钮 -->
  <n-button v-can="'create:User'">创建用户</n-button>
</template>
```

#### 多个权限检查（AND 逻辑）
```vue
<template>
  <!-- 需要同时拥有两个权限 -->
  <n-button v-can="['create:User', 'read:Role']">
    创建用户
  </n-button>
</template>
```

#### 多个权限检查（OR 逻辑）
```vue
<template>
  <!-- 拥有任意一个权限即可 -->
  <n-button v-can:any="['update:User', 'delete:User']">
    管理用户
  </n-button>
</template>
```

### 3. 在组合式函数中使用

```typescript
<script setup lang="ts">
import { useCan, usePermission } from '@/modules/access'

// 方式 1: 使用 useCan
const { can, cannot } = useCan()
const canCreateUser = can('create', 'User')
const cannotDeleteUser = cannot('delete', 'User')

// 方式 2: 使用 usePermission
const canUpdateContract = usePermission('update', 'Contract')

// 方式 3: 检查多个权限
import { useAnyPermission, useAllPermissions } from '@/modules/access'

const canManageUser = useAnyPermission([
  ['create', 'User'],
  ['update', 'User'],
  ['delete', 'User'],
])

const canFullyManage = useAllPermissions([
  ['create', 'User'],
  ['read', 'Role'],
])
</script>

<template>
  <n-button v-if="canCreateUser" @click="handleCreate">
    创建用户
  </n-button>
</template>
```

### 4. 在路由中使用

#### 方式 1: 使用 CASL (推荐)

```typescript
// src/router/modules/user.routes.ts
import type { AppRouteRecord } from '../types'

export const userRoutes: AppRouteRecord[] = [
  {
    path: 'users',
    name: 'user-list',
    component: () => import('@/views/user/UserList.vue'),
    meta: {
      name: '用户列表',
      // 使用 CASL 权限规则
      ability: {
        action: 'read',
        subject: 'User',
      },
    },
  },
  {
    path: 'users/create',
    name: 'user-create',
    component: () => import('@/views/user/UserCreate.vue'),
    meta: {
      name: '创建用户',
      // 需要多个权限
      ability: [
        { action: 'create', subject: 'User' },
        { action: 'read', subject: 'Role' },
      ],
    },
  },
]
```

#### 方式 2: 使用旧方式（兼容）

```typescript
export const userRoutes: AppRouteRecord[] = [
  {
    path: 'users',
    name: 'user-list',
    component: () => import('@/views/user/UserList.vue'),
    meta: {
      name: '用户列表',
      // 旧方式：使用字符串数组
      permissions: ['user:read'],
      roles: ['admin'],
    },
  },
]
```

### 5. 在 JavaScript/TypeScript 中使用

```typescript
import { can, cannot, ability } from '@/modules/access'

// 简单检查
if (can('create', 'User')) {
  console.log('可以创建用户')
}

if (cannot('delete', 'Contract')) {
  console.log('不能删除合同')
}

// 使用原始 ability 实例
if (ability.can('approve', 'Approval')) {
  // 执行审批操作
}
```

## 📚 权限动作 (Actions)

系统支持以下权限动作：

| Action | 说明 | 示例 |
|--------|------|------|
| `create` | 创建 | `create:User` |
| `read` | 读取 | `read:Contract` |
| `update` | 更新 | `update:Role` |
| `delete` | 删除 | `delete:Permission` |
| `manage` | 管理（所有操作） | `manage:User` |
| `approve` | 审批 | `approve:Approval` |
| `reject` | 拒绝 | `reject:Approval` |
| `assign` | 分配 | `assign:Role` |
| `export` | 导出 | `export:Contract` |
| `import` | 导入 | `import:User` |

## 📚 权限主体 (Subjects)

系统支持以下资源类型：

| Subject | 说明 |
|---------|------|
| `User` | 用户管理 |
| `Role` | 角色管理 |
| `Permission` | 权限管理 |
| `Contract` | 合同 |
| `Approval` | 审批 |
| `ApprovalTask` | 审批任务 |
| `Business` | 业务 |
| `Dashboard` | 仪表盘 |
| `all` | 所有资源 |

## 🔧 高级用法

### 1. 动态更新权限

用户登录/登出时，权限会自动更新：

```typescript
// 在 useAccountStore 中已集成
function login(data: SignInResponse) {
  // ... 其他登录逻辑

  // 自动更新 CASL 权限
  updateAbility(data.permissionList, data.roleList)
}

function logout() {
  // 自动清空 CASL 权限
  clearAbility()
  $reset()
}
```

### 2. 管理员权限

如果用户角色是 `admin` 或 `super_admin`，将自动拥有所有权限：

```typescript
// 在 ability.ts 中的逻辑
if (roles.some((role) => role.name === 'admin' || role.name === 'super_admin')) {
  can('manage', 'all') // 拥有所有权限
}
```

### 3. 权限拒绝追踪

所有权限拒绝事件都会自动记录到可观测性系统：

```typescript
// 自动调用
capturePermissionError(action, subject, reason)
```

可以在 SigNoz 中查看权限拒绝日志。

## 🎯 最佳实践

### 1. 优先使用 CASL

```typescript
// ✅ 推荐：使用 CASL
meta: {
  ability: { action: 'create', subject: 'User' }
}

// ⚠️ 不推荐：使用旧方式
meta: {
  permissions: ['user:create']
}
```

### 2. 细粒度权限控制

```typescript
// ✅ 好：细粒度控制
<n-button v-can="'create:User'">创建</n-button>
<n-button v-can="'update:User'">编辑</n-button>
<n-button v-can="'delete:User'">删除</n-button>

// ❌ 差：粗粒度控制
<n-button v-can="'manage:User'">所有操作</n-button>
```

### 3. 组合权限检查

```typescript
// ✅ 好：使用组合式函数
const canManage = useAnyPermission([
  ['create', 'User'],
  ['update', 'User'],
  ['delete', 'User'],
])

// ❌ 差：重复检查
const canCreate = usePermission('create', 'User')
const canUpdate = usePermission('update', 'User')
const canDelete = usePermission('delete', 'User')
const canManage = computed(() =>
  canCreate.value || canUpdate.value || canDelete.value
)
```

## 🐛 故障排查

### 1. 权限不生效

检查：
- 用户是否已登录
- 权限格式是否正确（`action:Subject`）
- Subject 首字母是否大写

### 2. 路由守卫不工作

检查：
- `setupAbilityGuard` 是否在 `setup.ts` 中注册
- 路由 meta 中的 `ability` 字段是否正确

### 3. 指令不工作

检查：
- 指令是否在 `main.ts` 中注册
- 权限字符串格式是否正确

## 📖 相关文件

- **核心逻辑**: `src/modules/access/application/ability.ts`
- **组合式函数**: `src/modules/access/application/hooks/useCan.ts`
- **指令**: `src/modules/access/presentation/directives/can.ts`
- **路由守卫**: `src/router/guards/SetupAbilityGuard.ts`
- **Store 集成**: `src/modules/user/application/stores/useAccountStore.ts`

## 🔗 参考资料

- [CASL 官方文档](https://casl.js.org/)
- [Vue CASL 集成](https://casl.js.org/v6/en/package/casl-vue)
