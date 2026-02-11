import { beforeEach, describe, expect, it, vi } from 'vitest'

const { hasRoleSpy, hasPermissionSpy, useAccountStoreSpy } = vi.hoisted(() => ({
  hasRoleSpy: vi.fn<(role: string) => boolean>(),
  hasPermissionSpy: vi.fn<(permission: string) => boolean>(),
  useAccountStoreSpy: vi.fn(),
}))

vi.mock('@/modules/user/application/stores/useAccountStore', () => ({
  useAccountStore: useAccountStoreSpy,
}))

import permissionDirective from '@/directives/permission'

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

    ;(permissionDirective as any).mounted?.(
      el,
      {
        value: 'agreement:edit',
      } as any,
    )

    expect(hasPermissionSpy).toHaveBeenCalledWith('agreement:edit')
    expect(el.isConnected).toBe(false)
  })

  it('checks role when arg is role and keeps element when authorized', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    ;(permissionDirective as any).mounted?.(
      el,
      {
        arg: 'role',
        value: 'admin',
      } as any,
    )

    expect(hasRoleSpy).toHaveBeenCalledWith('admin')
    expect(hasPermissionSpy).not.toHaveBeenCalled()
    expect(el.isConnected).toBe(true)
  })

  it('requires all permissions when binding value is an array', () => {
    hasPermissionSpy.mockImplementation((permission) => permission !== 'agreement:approve')

    const el = document.createElement('div')
    document.body.appendChild(el)

    ;(permissionDirective as any).updated?.(
      el,
      {
        value: ['agreement:view', 'agreement:approve'],
      } as any,
    )

    expect(hasPermissionSpy).toHaveBeenNthCalledWith(1, 'agreement:view')
    expect(hasPermissionSpy).toHaveBeenNthCalledWith(2, 'agreement:approve')
    expect(el.isConnected).toBe(false)
  })

  it('does nothing when binding value is empty', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)

    ;(permissionDirective as any).mounted?.(
      el,
      {
        value: undefined,
      } as any,
    )

    expect(hasRoleSpy).not.toHaveBeenCalled()
    expect(hasPermissionSpy).not.toHaveBeenCalled()
    expect(el.isConnected).toBe(true)
  })
})
