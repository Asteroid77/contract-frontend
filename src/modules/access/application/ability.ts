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
  | 'claim' // 领取
  | 'handle' // 处理
  | 'record' // 记录
  | 'submit' // 提交
  | 'upload' // 上传
  | 'duplicate-check' // 重复校验
  | 'export' // 导出
  | 'import' // 导入

/**
 * 权限主体类型
 * 使用后端 canonical 权限 subject 原文。
 */
export type Subject =
  | 'permission-page' // 权限分页
  | 'role-permissions-page' // 角色权限分页
  | 'role-page' // 角色分页
  | 'role' // 角色管理
  | 'user-role' // 用户角色关联
  | 'user-page' // 用户分页
  | 'user' // 用户管理
  | 'approval-instance-page' // 审批实例分页
  | 'approval-instance' // 审批实例
  | 'approval-history' // 审批历史
  | 'approval-task' // 审批任务
  | 'service-agreement-page' // 售电协议分页
  | 'service-agreement' // 售电协议
  | 'service-agreement-file' // 售电协议附件
  | 'service-agreement-attachments' // 售电协议附件预览
  | 'agent-dashboard' // 代理看板
  | 'agent-dashboard:global' // 代理看板全局权限
  | 'work-order-category' // 工单分类
  | 'work-order:filing-contract' // 归档合同工单
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
 * - "create:user" -> can('create', 'user')
 * - "read:user-page" -> can('read', 'user-page')
 * - "read:agent-dashboard:global" -> can('read', 'agent-dashboard:global')
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
 * 仅支持后端 canonical 格式：
 * - "create:user" -> { action: 'create', subject: 'user' }
 * - "read:user-page" -> { action: 'read', subject: 'user-page' }
 * - "read:agent-dashboard:global" -> { action: 'read', subject: 'agent-dashboard:global' }
 *
 * @param permissionName 权限名称
 */
function parsePermission(permissionName: string): { action: Action; subject: Subject } | null {
  const parts = permissionName
    .split(':')
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length < 2) {
    console.warn(`[CASL] Invalid permission format: ${permissionName}`)
    return null
  }

  const action = parseAction(parts[0]!)
  const subject = parseSubject(parts.slice(1).join(':'))

  if (!action || !subject) {
    console.warn(`[CASL] Invalid permission value: ${permissionName}`)
    return null
  }

  return { action, subject }
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

function parseAction(raw: string): Action | null {
  return isValidAction(raw) ? raw : null
}

function parseSubject(raw: string): Subject | null {
  return isValidSubject(raw) ? raw : null
}

/**
 * 验证 Subject 是否有效
 */
function isValidSubject(subject: string): subject is Subject {
  const validSubjects: Subject[] = [
    'permission-page',
    'role-permissions-page',
    'role-page',
    'role',
    'user-role',
    'user-page',
    'user',
    'approval-instance-page',
    'approval-instance',
    'approval-history',
    'approval-task',
    'service-agreement-page',
    'service-agreement',
    'service-agreement-file',
    'service-agreement-attachments',
    'agent-dashboard',
    'agent-dashboard:global',
    'work-order-category',
    'work-order:filing-contract',
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
    'claim',
    'handle',
    'record',
    'submit',
    'upload',
    'duplicate-check',
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
 * can('create', 'user') // 是否可以创建用户
 * can('read', 'service-agreement') // 是否可以读取售电协议
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
