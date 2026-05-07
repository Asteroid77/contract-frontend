/**
 * CASL 权限指令
 * 用于在模板中进行权限控制
 *
 * 使用方式：
 * 1. v-can="'create:user'" - 检查单个权限
 * 2. v-can="['create:user', 'update:user']" - 检查多个权限（AND）
 * 3. v-can:any="['create:user', 'update:user']" - 检查多个权限（OR）
 */

import type { Directive, DirectiveBinding } from 'vue'
import { ability, type Action, type Subject } from '../../application/ability'
import { capturePermissionError } from '@/app/observability/lazy'

interface PermissionValue {
  action: Action
  subject: Subject
}

/**
 * 解析权限字符串
 * @example
 * parsePermissionString('read:agent-dashboard:global') -> { action: 'read', subject: 'agent-dashboard:global' }
 */
function parsePermissionString(permission: string): PermissionValue | null {
  const parts = permission.split(':')
  if (parts.length < 2) {
    console.warn(`[v-can] Invalid permission format: ${permission}`)
    return null
  }

  const [action, ...subjectParts] = parts
  return {
    action: action as Action,
    subject: subjectParts.join(':') as Subject,
  }
}

/**
 * 检查权限
 */
function checkPermission(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
  const { value, arg } = binding

  if (!value) {
    return
  }

  let hasPermission = false

  // 处理单个权限字符串
  if (typeof value === 'string') {
    const perm = parsePermissionString(value)
    if (perm) {
      hasPermission = ability.can(perm.action, perm.subject)

      // 记录权限拒绝
      if (!hasPermission) {
        capturePermissionError(perm.action, perm.subject, 'Directive check failed')
      }
    }
  }
  // 处理多个权限
  else if (Array.isArray(value)) {
    const permissions = value
      .map(parsePermissionString)
      .filter((p): p is PermissionValue => p !== null)

    // arg === 'any' 表示 OR 逻辑，否则为 AND 逻辑
    if (arg === 'any') {
      hasPermission = permissions.some((perm) => ability.can(perm.action, perm.subject))
    } else {
      hasPermission = permissions.every((perm) => ability.can(perm.action, perm.subject))
    }

    // 记录权限拒绝
    if (!hasPermission) {
      const actions = permissions.map((p) => p.action).join(', ')
      const subjects = permissions.map((p) => p.subject).join(', ')
      capturePermissionError(
        actions,
        subjects,
        `Directive check failed (${arg === 'any' ? 'OR' : 'AND'} logic)`,
      )
    }
  }

  // 如果没有权限，移除元素
  if (!hasPermission) {
    el.remove()
  }
}

/**
 * CASL 权限指令
 */
export const canDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    checkPermission(el, binding)
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    checkPermission(el, binding)
  },
}

export default canDirective
