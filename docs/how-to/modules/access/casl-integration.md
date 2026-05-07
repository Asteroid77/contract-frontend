Status: active
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# CASL 权限管理系统集成指南

## 概述

本项目已集成 CASL (Conditional Access Control Library)，提供细粒度的权限控制能力。

### 架构设计

遵循 DDD 架构：

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

## 快速开始

### 1. 权限格式

后端权限格式：`action:subject[:scope]`，前端直接消费 canonical subject 原文。

示例：
- `read:user-page` - 查询用户分页
- `read:user` - 读取用户详情
- `read:agent-dashboard:global` - 读取全局代理看板

### 2. 在模板中使用

#### 单个权限检查
```vue
<template>
  <!-- 只有拥有 read:user 权限的用户才能看到此按钮 -->
  <n-button v-can="'read:user'">查看用户</n-button>
</template>
```

#### 多个权限检查（AND 逻辑）
```vue
<template>
  <!-- 需要同时拥有两个权限 -->
  <n-button v-can="['read:user-page', 'read:role-page']">
    查看管理数据
  </n-button>
</template>
```

#### 多个权限检查（OR 逻辑）
```vue
<template>
  <!-- 拥有任意一个权限即可 -->
  <n-button v-can:any="['update:user', 'delete:user']">
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
const canReadUser = can('read', 'user')
const cannotDeleteUser = cannot('delete', 'user')

// 方式 2: 使用 usePermission
const canUpdateUser = usePermission('update', 'user')

// 方式 3: 检查多个权限
import { useAnyPermission, useAllPermissions } from '@/modules/access'

const canManageUser = useAnyPermission([
  ['read', 'user'],
  ['update', 'user'],
  ['delete', 'user'],
])

const canFullyManage = useAllPermissions([
  ['read', 'user-page'],
  ['read', 'role-page'],
])
</script>

<template>
  <n-button v-if="canReadUser" @click="handleView">
    查看用户
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
        subject: 'user-page',
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
        { action: 'update', subject: 'user' },
        { action: 'read', subject: 'role-page' },
      ],
    },
  },
]
```

### 5. 在 JavaScript/TypeScript 中使用

```typescript
import { can, cannot, ability } from '@/modules/access'

// 简单检查
if (can('read', 'user')) {
  console.log('可以查看用户')
}

if (cannot('delete', 'user')) {
  console.log('不能删除用户')
}

// 使用原始 ability 实例
if (ability.can('claim', 'approval-task')) {
  // 领取审批任务
}
```

## 权限动作 (Actions)

系统支持以下权限动作：

| Action | 说明 | 示例 |
|--------|------|------|
| `create` | 创建 | `create:role` |
| `read` | 读取 | `read:user-page` |
| `update` | 更新 | `update:user` |
| `delete` | 删除 | `delete:user` |
| `manage` | 管理（所有操作） | `manage:work-order-category` |
| `approve` | 审批 | `approve:approval-instance` |
| `reject` | 拒绝 | `reject:approval-instance` |
| `assign` | 分配 | `assign:user-role` |
| `export` | 导出 | `export:service-agreement` |
| `import` | 导入 | `import:service-agreement` |

## 权限主体 (Subjects)

系统支持以下资源类型：

| Subject | 说明 |
|---------|------|
| `user-page` | 用户分页 |
| `user` | 用户管理 |
| `role-page` | 角色分页 |
| `role` | 角色管理 |
| `permission-page` | 权限分页 |
| `approval-task` | 审批任务 |
| `service-agreement` | 售电协议 |
| `agent-dashboard:global` | 全局代理看板 |
| `work-order-category` | 工单分类 |
| `all` | 所有资源 |

## 高级用法

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

### 2. 权限拒绝追踪

所有权限拒绝事件都会自动记录到可观测性系统：

```typescript
// 自动调用
capturePermissionError(action, subject, reason)
```

可以在 SigNoz 中查看权限拒绝日志。

## 最佳实践

### 1. 优先使用 CASL

```typescript
// ✅ 推荐：使用 CASL
meta: {
  ability: { action: 'read', subject: 'user-page' }
}
```

### 2. 细粒度权限控制

```typescript
// ✅ 好：细粒度控制
<n-button v-can="'read:user'">查看</n-button>
<n-button v-can="'update:user'">编辑</n-button>
<n-button v-can="'delete:user'">删除</n-button>

// ❌ 差：用管理权限替代明确动作
<n-button v-can="'manage:all'">所有操作</n-button>
```

### 3. 组合权限检查

```typescript
// ✅ 好：使用组合式函数
const canManage = useAnyPermission([
  ['read', 'user'],
  ['update', 'user'],
  ['delete', 'user'],
])

// ❌ 差：重复检查
const canRead = usePermission('read', 'user')
const canUpdate = usePermission('update', 'user')
const canDelete = usePermission('delete', 'user')
const canManage = computed(() =>
  canRead.value || canUpdate.value || canDelete.value
)
```

## 故障排查

### 1. 权限不生效

检查：
- 用户是否已登录
- 权限格式是否正确（`action:subject[:scope]`）
- subject 是否使用后端 canonical 原文

### 2. 路由守卫不工作

检查：
- `setupAbilityGuard` 是否在 `setup.ts` 中注册
- 路由 meta 中的 `ability` 字段是否正确

### 3. 指令不工作

检查：
- 指令是否在 `main.ts` 中注册
- 权限字符串格式是否正确

## 相关文件

- **核心逻辑**: `src/modules/access/application/ability.ts`
- **组合式函数**: `src/modules/access/application/hooks/useCan.ts`
- **指令**: `src/modules/access/presentation/directives/can.ts`
- **路由守卫**: `src/router/guards/SetupAbilityGuard.ts`
- **Store 集成**: `src/modules/user/application/stores/useAccountStore.ts`

## 参考资料

- [CASL 官方文档](https://casl.js.org/)
- [Vue CASL 集成](https://casl.js.org/v6/en/package/casl-vue)
