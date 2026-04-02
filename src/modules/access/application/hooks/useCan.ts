/**
 * CASL 权限检查组合式函数
 * 提供响应式的权限检查能力
 */

import { computed, type ComputedRef } from 'vue'
import { ability, type Action, type Subject } from '../ability'
import { useAbility } from '@casl/vue'

/**
 * 使用 CASL 权限检查
 * 返回响应式的权限检查函数
 *
 * @example
 * const { can, cannot } = useCan()
 * const canCreateUser = can('create', 'User')
 * const cannotDeleteUser = cannot('delete', 'User')
 */
export function useCan() {
  const $ability = useAbility()

  return {
    /**
     * 检查是否可以执行某个操作
     */
    can: (action: Action, subject: Subject): ComputedRef<boolean> => {
      return computed(() => $ability.can(action, subject))
    },

    /**
     * 检查是否不能执行某个操作
     */
    cannot: (action: Action, subject: Subject): ComputedRef<boolean> => {
      return computed(() => $ability.cannot(action, subject))
    },

    /**
     * 原始 ability 实例
     */
    ability: $ability,
  }
}

/**
 * 检查是否拥有指定权限
 * 用于在 setup 中进行权限检查
 *
 * @example
 * const canCreate = usePermission('create', 'User')
 * if (canCreate.value) {
 *   // 显示创建按钮
 * }
 */
export function usePermission(action: Action, subject: Subject): ComputedRef<boolean> {
  return computed(() => ability.can(action, subject))
}

/**
 * 检查是否拥有多个权限中的任意一个（OR 逻辑）
 *
 * @example
 * const canManageUser = useAnyPermission([
 *   ['create', 'User'],
 *   ['update', 'User'],
 *   ['delete', 'User'],
 * ])
 */
export function useAnyPermission(permissions: Array<[Action, Subject]>): ComputedRef<boolean> {
  return computed(() => {
    return permissions.some(([action, subject]) => ability.can(action, subject))
  })
}

/**
 * 检查是否拥有所有权限（AND 逻辑）
 *
 * @example
 * const canFullyManageUser = useAllPermissions([
 *   ['create', 'User'],
 *   ['update', 'User'],
 *   ['delete', 'User'],
 * ])
 */
export function useAllPermissions(permissions: Array<[Action, Subject]>): ComputedRef<boolean> {
  return computed(() => {
    return permissions.every(([action, subject]) => ability.can(action, subject))
  })
}
