# access 模块 Agent 指令

## 全局规则引用

本模块内改动仍以本模块边界与分层规则为先；但 UI（discrete / theme）、文案（i18n）与搜索（advanced_query，`ModernQueryBuilder`）规则统一遵循 `Rule.md`。

## 定位

`src/modules/access` 负责认证令牌管理和基于 CASL 的 RBAC 权限控制。它为整个应用提供两项核心能力：

1. **Token 生命周期**：access token 的存储、过期检测、自动刷新（含跨 tab 锁协调和失败退避）。
2. **权限系统**：从后端权限/角色数据构建 CASL Ability，提供组合式函数、Vue 指令和命令式 API 供其他模块消费。

## 目录与职责

```
access/
├── domain/           # 领域类型（Permission, RoleVo, DTO）
├── application/      # 应用层
│   ├── ability.ts        # CASL Ability 定义、规则解析、全局实例
│   ├── token-manager.ts  # Token 存取、刷新、跨 tab 锁、主动续期
│   ├── service.ts        # 应用服务（角色/权限 CRUD 编排）
│   ├── models.ts         # 应用层视图模型与查询类型
│   ├── validation.ts     # 登录/注册/找回密码表单校验规则
│   └── hooks/            # Vue 组合式函数
│       ├── useCan.ts           # 响应式权限检查
│       ├── useRoleService.ts   # 角色查询/编辑（vue-query）
│       └── useUserRoleService.ts # 用户-角色分配（vue-query）
├── infrastructure/   # 基础设施
│   ├── access-repository.ts  # 角色/权限/用户角色 API 调用
│   └── auth-endpoints.ts     # 认证相关 endpoint 常量
└── presentation/     # 表现层
    ├── directives/can.ts     # v-can 权限指令
    └── role/                 # 角色管理页面组件
        ├── RolePage.vue
        └── RoleAssign.vue
```

## 依赖约束

### 允许

- `domain/` 可依赖 `@/modules/shared/domain`（分页、查询类型）。
- `application/` 可依赖本模块 `domain/`、`infrastructure/`，以及 `@/modules/shared/application`。
- `application/token-manager` 可依赖 `@/app/infrastructure`（HTTP 客户端）和 `@/modules/shared/domain`（响应类型）。
- `application/validation` 可依赖 `@/modules/user/application/models`（表单类型定义）和 `@/modules/shared/application/rules`。
- `infrastructure/` 可依赖 `@/modules/shared/infrastructure`（useRequest、apiPrefixGenerator）。
- `presentation/` 可依赖 Vue、`@casl/vue`、本模块 `application/`。
- 其他业务模块可 `import` access 的 `index.ts` 导出（ability、hooks、指令、类型）。

### 禁止

- `domain/` 禁止依赖 Vue、axios、Naive UI 或任何框架实现。
- access 模块禁止直接 `import` 其他业务模块的实现（`validation.ts` 对 user 模块类型的依赖是已有耦合，不可扩大）。
- 禁止在 `domain/` 层引入 `infrastructure/` 的具体实现。
- 禁止绕过 `index.ts` 直接从内部路径导入（对外消费者而言）。

## 关键导出（via index.ts）

| 导出                                                                 | 来源                        | 说明                     |
| -------------------------------------------------------------------- | --------------------------- | ------------------------ |
| `ability`, `can`, `cannot`                                           | application/ability         | 全局权限实例与命令式检查 |
| `createAbility`, `defineAbilityFor`, `updateAbility`, `clearAbility` | application/ability         | Ability 生命周期管理     |
| `Action`, `Subject`, `AppAbility`                                    | application/ability         | 权限类型定义             |
| `useCan`, `usePermission`, `useAnyPermission`, `useAllPermissions`   | application/hooks/useCan    | 响应式权限检查           |
| `canDirective`                                                       | presentation/directives/can | `v-can` 模板指令         |
| `Permission`, `RoleVo`, `AssignedUserOptions`                        | domain/types                | 领域类型                 |
| `RoleItem`, `RoleForm`, `RoleAssignRequest` 等                       | application/models          | 应用层模型               |

**未从 index.ts 导出但被外部直接引用**：`application/token-manager`（被 `shared/infrastructure/useRequest` 直接导入，历史耦合）。

## 修改本模块的规则

1. `token-manager.ts` 是全局认证的核心，改动需评估对所有请求流程的影响（useRequest 的 401 重试依赖它）。
2. `ability.ts` 中的 `Subject` / `Action` 枚举扩展需与后端权限字符串格式保持同步。
3. 新增 Subject 时，同步更新 `SUBJECT_ALIAS_MAP` 和 `isValidSubject` 中的列表。
4. `validation.ts` 依赖 `@/modules/user` 的表单类型，这是已知耦合，不应继续扩大跨模块依赖。
5. 每个子目录下的 `__tests__/` 包含单元测试，改动后运行 `pnpm test:unit` 验证。
