/**
 * CASL 权限管理系统
 * 基于 @casl/ability 实现细粒度的权限控制
 *
 * 架构说明：
 * 1. 使用 CASL 的 Ability 类定义权限规则
 * 2. 支持动态更新权限（用户登录/登出时）
 * 3. 提供类型安全的权限检查
 * 4. 集成到路由守卫、指令、组合式函数中
 */

import { Ability, AbilityBuilder, type AbilityClass, type PureAbility } from '@casl/ability'
import type { Permission, RoleVo } from '../domain/types'

// ============================================================
// 类型定义
// ============================================================

/**
 * 权限动作类型
 * 遵循 CRUD + 特殊操作的模式
 */
export type Action =
  | 'create' // 创建
  | 'read' // 读取
  | 'update' // 更新
  | 'delete' // 删除
  | 'manage' // 管理（所有操作）
  | 'approve' // 审批
  | 'reject' // 拒绝
  | 'assign' // 分配
  | 'export' // 导出
  | 'import' // 导入

/**
 * 权限主体类型
 * 定义系统中所有可以被权限控制的资源
 */
export type Subject =
  | 'User' // 用户管理
  | 'Role' // 角色管理
  | 'Permission' // 权限管理
  | 'Contract' // 合同
  | 'Approval' // 审批
  | 'ApprovalTask' // 审批任务
  | 'Business' // 业务
  | 'Dashboard' // 仪表盘
  | 'WorkOrder' // 工单
  | 'WorkOrderCategory' // 工单分类
  | 'all' // 所有资源

/**
 * 应用权限类型
 * 定义了 Action 和 Subject 的组合
 */
export type AppAbility = PureAbility<[Action, Subject]>

// ============================================================
// 权限实例创建
// ============================================================

/**
 * 创建一个新的 Ability 实例
 * 默认没有任何权限
 */
export function createAbility(): AppAbility {
  const { build } = new AbilityBuilder<AppAbility>(Ability as AbilityClass<AppAbility>)
  return build()
}

/**
 * 全局权限实例
 * 在应用启动时创建，用户登录后更新
 */
export const ability = createAbility()

// ============================================================
// 权限规则构建
// ============================================================

/**
 * 从后端权限数据构建 CASL 规则
 *
 * 后端权限格式示例：
 * - "user:create" -> can('create', 'User')
 * - "contract:read" -> can('read', 'Contract')
 * - "approval:*" -> can('manage', 'Approval')
 *
 * @param permissions 权限列表
 * @param roles 角色列表
 */
export function defineAbilityFor(permissions: Permission[], roles: RoleVo[]): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(Ability as AbilityClass<AppAbility>)

  // 1. 处理细粒度权限
  permissions.forEach((permission) => {
    const rule = parsePermission(permission.name)
    if (rule) {
      can(rule.action, rule.subject)
    }
  })

  // 2. 处理角色中的权限
  roles.forEach((role) => {
    role.permissions?.forEach((permission) => {
      const rule = parsePermission(permission.name)
      if (rule) {
        can(rule.action, rule.subject)
      }
    })
  })

  return build()
}

/**
 * 解析权限字符串为 CASL 规则
 *
 * 支持的格式：
 * - "user:create" -> { action: 'create', subject: 'User' }
 * - "create:user" -> { action: 'create', subject: 'User' }
 * - "contract:*" -> { action: 'manage', subject: 'Contract' }
 * - "view:user" -> { action: 'read', subject: 'User' }
 * - "edit:user" -> { action: 'update', subject: 'User' }
 * - "disabled:user" -> { action: 'delete', subject: 'User' }
 * - "list:user" -> { action: 'read', subject: 'User' }
 *
 * @param permissionName 权限名称
 */
function parsePermission(permissionName: string): { action: Action; subject: Subject } | null {
  const parts = permissionName.split(':')
  if (parts.length !== 2) {
    console.warn(`[CASL] Invalid permission format: ${permissionName}`)
    return null
  }

  const [left, right] = parts
  const direct = parsePermissionPair(left, right)
  if (direct) {
    return direct
  }

  const reversed = parsePermissionPair(right, left)
  if (reversed) {
    return reversed
  }

  console.warn(`[CASL] Invalid permission value: ${permissionName}`)
  return null
}

/**
 * 更新全局权限实例
 * 在用户登录/登出时调用
 */
export function updateAbility(permissions: Permission[], roles: RoleVo[]): void {
  const newAbility = defineAbilityFor(permissions, roles)
  ability.update(newAbility.rules)
}

/**
 * 清空权限
 * 在用户登出时调用
 */
export function clearAbility(): void {
  ability.update([])
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 首字母大写
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * 权限别名映射
 * - 兼容后端常见命名：view/edit/disabled/list
 */
const ACTION_ALIAS_MAP: Record<string, Action> = {
  '*': 'manage',
  view: 'read',
  list: 'read',
  edit: 'update',
  disabled: 'delete',
  disable: 'delete',
}

const SUBJECT_ALIAS_MAP: Record<string, Subject> = {
  user: 'User',
  role: 'Role',
  permission: 'Permission',
  contract: 'Contract',
  approval: 'Approval',
  approvaltask: 'ApprovalTask',
  approval_task: 'ApprovalTask',
  'approval-task': 'ApprovalTask',
  business: 'Business',
  dashboard: 'Dashboard',
  workorder: 'WorkOrder',
  work_order: 'WorkOrder',
  'work-order': 'WorkOrder',
  workordercategory: 'WorkOrderCategory',
  work_order_category: 'WorkOrderCategory',
  'work-order-category': 'WorkOrderCategory',
  all: 'all',
}

function normalizeAction(raw: string): Action | null {
  const lowered = raw.trim().toLowerCase()
  const aliasMapped = ACTION_ALIAS_MAP[lowered] ?? lowered
  return isValidAction(aliasMapped) ? aliasMapped : null
}

function normalizeSubject(raw: string): Subject | null {
  const lowered = raw.trim().toLowerCase()
  const aliasMapped = SUBJECT_ALIAS_MAP[lowered]
  if (aliasMapped) {
    return aliasMapped
  }

  const byCapitalize = capitalizeFirstLetter(lowered)
  if (isValidSubject(byCapitalize)) {
    return byCapitalize
  }

  return null
}

function parsePermissionPair(
  subjectRaw: string,
  actionRaw: string,
): { action: Action; subject: Subject } | null {
  const subject = normalizeSubject(subjectRaw)
  const action = normalizeAction(actionRaw)
  if (!subject || !action) {
    return null
  }
  return { action, subject }
}

/**
 * 验证 Subject 是否有效
 */
function isValidSubject(subject: string): subject is Subject {
  const validSubjects: Subject[] = [
    'User',
    'Role',
    'Permission',
    'Contract',
    'Approval',
    'ApprovalTask',
    'Business',
    'Dashboard',
    'WorkOrder',
    'WorkOrderCategory',
    'all',
  ]
  return validSubjects.includes(subject as Subject)
}

/**
 * 验证 Action 是否有效
 */
function isValidAction(action: string): action is Action {
  const validActions: Action[] = [
    'create',
    'read',
    'update',
    'delete',
    'manage',
    'approve',
    'reject',
    'assign',
    'export',
    'import',
  ]
  return validActions.includes(action as Action)
}

// ============================================================
// 便捷检查函数
// ============================================================

/**
 * 检查是否可以执行某个操作
 * @example
 * can('create', 'User') // 是否可以创建用户
 * can('read', 'Contract') // 是否可以读取合同
 */
export function can(action: Action, subject: Subject): boolean {
  return ability.can(action, subject)
}

/**
 * 检查是否不能执行某个操作
 */
export function cannot(action: Action, subject: Subject): boolean {
  return ability.cannot(action, subject)
}
