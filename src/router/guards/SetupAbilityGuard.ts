/**
 * CASL 路由守卫
 * 基于 CASL 权限系统的路由级别权限控制
 *
 * 使用方式：
 * 在路由 meta 中定义 ability 字段
 *
 * @example
 * {
 *   path: '/users',
 *   meta: {
 *     ability: {
 *       action: 'read',
 *       subject: 'User'
 *     }
 *   }
 * }
 *
 * 或者使用数组（AND 逻辑）
 * {
 *   path: '/users/create',
 *   meta: {
 *     ability: [
 *       { action: 'create', subject: 'User' },
 *       { action: 'read', subject: 'Role' }
 *     ]
 *   }
 * }
 */

import type { Router } from 'vue-router'
import { ability, type Action, type Subject } from '@/modules/access/application/ability'
import { capturePermissionError } from '@/app/observability/lazy'

export interface AbilityRule {
  action: Action
  subject: Subject
}

/**
 * 设置 CASL 路由守卫
 */
export function setupAbilityGuard(router: Router) {
  router.beforeEach((to) => {
    const abilityRules = to.meta.ability as AbilityRule | AbilityRule[] | undefined

    // 如果路由没有定义 ability，放行
    if (!abilityRules) {
      return true
    }

    // 处理单个规则
    if (!Array.isArray(abilityRules)) {
      const canAccess = ability.can(abilityRules.action, abilityRules.subject)

      if (!canAccess) {
        capturePermissionError(
          abilityRules.action,
          abilityRules.subject,
          `Route access denied: ${String(to.name)}`,
        )
        return { name: '403' }
      }

      return true
    }

    // 处理多个规则（AND 逻辑）
    const canAccess = abilityRules.every((rule) => ability.can(rule.action, rule.subject))

    if (!canAccess) {
      const failedRules = abilityRules.filter((rule) => !ability.can(rule.action, rule.subject))
      capturePermissionError(
        failedRules.map((r) => r.action).join(', '),
        failedRules.map((r) => r.subject).join(', '),
        `Route access denied: ${String(to.name)}`,
      )
      return { name: '403' }
    }

    return true
  })
}
