import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DirectiveBinding } from 'vue'

const { hasRoleSpy, hasPermissionSpy, useAccountStoreSpy } = vi.hoisted(() => ({
  hasRoleSpy: vi.fn<(role: string) => boolean>(),
  hasPermissionSpy: vi.fn<(permission: string) => boolean>(),
  useAccountStoreSpy: vi.fn(),
}))

vi.mock('@/modules/user/application/stores/useAccountStore', () => ({
  useAccountStore: useAccountStoreSpy,
}))

import permissionDirective from '@/directives/permission'

type PermissionBinding = DirectiveBinding<string | string[]>

const createBinding = (
  value: string | string[] | undefined,
  arg?: string,
): PermissionBinding =>
  ({
    instance: null,
    value,
    oldValue: undefined,
    arg,
    modifiers: {},
    dir: {} as PermissionBinding['dir'],
  }) as PermissionBinding

const directive = permissionDirective as {
  mounted?: (el: HTMLElement, binding: PermissionBinding) => void
  updated?: (el: HTMLElement, binding: PermissionBinding) => void
}

describe('permission directive', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    hasRoleSpy.mockReturnValue(true)
    hasPermissionSpy.mockReturnValue(true)

    useAccountStoreSpy.mockReturnValue({
      hasRole: hasRoleSpy,
      hasPermission: hasPermissionSpy,
    })
  })

  it('removes element when permission check fails', () => {
    hasPermissionSpy.mockReturnValue(false)

    const el = document.createElement('div')
    document.body.appendChild(el)

    directive.mounted?.(el, createBinding('agreement:edit'))

    expect(hasPermissionSpy).toHaveBeenCalledWith('agreement:edit')
    expect(el.isConnected).toBe(false)
  })

  it('checks role when arg is role and keeps element when authorized', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    directive.mounted?.(el, createBinding('admin', 'role'))

    expect(hasRoleSpy).toHaveBeenCalledWith('admin')
    expect(hasPermissionSpy).not.toHaveBeenCalled()
    expect(el.isConnected).toBe(true)
  })

  it('requires all permissions when binding value is an array', () => {
    hasPermissionSpy.mockImplementation((permission) => permission !== 'agreement:approve')

    const el = document.createElement('div')
    document.body.appendChild(el)

    directive.updated?.(el, createBinding(['agreement:view', 'agreement:approve']))

    expect(hasPermissionSpy).toHaveBeenNthCalledWith(1, 'agreement:view')
    expect(hasPermissionSpy).toHaveBeenNthCalledWith(2, 'agreement:approve')
    expect(el.isConnected).toBe(false)
  })

  it('does nothing when binding value is empty', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    directive.mounted?.(el, createBinding(undefined))

    expect(hasRoleSpy).not.toHaveBeenCalled()
    expect(hasPermissionSpy).not.toHaveBeenCalled()
    expect(el.isConnected).toBe(true)
  })
})
