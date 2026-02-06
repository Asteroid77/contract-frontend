/**
 * Access 模块统一导出
 * 遵循 DDD 架构规范
 */

// ============================================================
// Application Layer - 应用层
// ============================================================

// CASL Ability 核心
export {
  ability,
  createAbility,
  defineAbilityFor,
  updateAbility,
  clearAbility,
  can,
  cannot,
  type Action,
  type Subject,
  type AppAbility,
} from './application/ability'

// Hooks - 组合式函数
export { useCan, usePermission, useAnyPermission, useAllPermissions } from './application/hooks/useCan'

// ============================================================
// Presentation Layer - 表现层
// ============================================================

// Directives - 指令
export { canDirective } from './presentation/directives/can'

// ============================================================
// Domain Layer - 领域层
// ============================================================

export type { Permission, RoleVo, AssignedUserOptions } from './domain/types'

// ============================================================
// Application Layer - 应用服务
// ============================================================

export type {
  RoleItem,
  PermissionItem,
  AssignedUserOption,
  RoleForm,
  RoleAssignRequest,
  RolePageQuery,
  PermissionPageQuery,
  RolePermissionsPageQuery,
} from './application/models'
