import { describe, expect, it, vi } from 'vitest'
import {
  useAllPermissions,
  useAnyPermission,
  useCan,
  usePermission,
} from '@/modules/access/application/hooks/useCan'

const { canSpy, cannotSpy } = vi.hoisted(() => ({
  canSpy: vi.fn(),
  cannotSpy: vi.fn(),
}))

vi.mock('@casl/vue', () => ({
  useAbility: vi.fn(() => ({
    can: canSpy,
    cannot: cannotSpy,
  })),
}))

vi.mock('@/modules/access/application/ability', () => ({
  ability: {
    can: canSpy,
  },
}))

describe('useCan hooks', () => {
  it('useCan exposes reactive can/cannot from useAbility', () => {
    canSpy.mockReturnValue(true)
    cannotSpy.mockReturnValue(false)

    const permission = useCan()

    expect(permission.can('read', 'User').value).toBe(true)
    expect(permission.cannot('delete', 'User').value).toBe(false)
    expect(permission.ability.can).toBe(canSpy)

    expect(canSpy).toHaveBeenCalledWith('read', 'User')
    expect(cannotSpy).toHaveBeenCalledWith('delete', 'User')
  })

  it('usePermission delegates to global ability', () => {
    canSpy.mockReturnValue(true)

    const result = usePermission('update', 'Role')

    expect(result.value).toBe(true)
    expect(canSpy).toHaveBeenCalledWith('update', 'Role')
  })

  it('useAnyPermission returns true when any permission passes', () => {
    canSpy.mockImplementation((action, subject) => action === 'read' && subject === 'User')

    const result = useAnyPermission([
      ['create', 'User'],
      ['read', 'User'],
      ['delete', 'User'],
    ])

    expect(result.value).toBe(true)
  })

  it('useAllPermissions returns false when one permission fails', () => {
    canSpy.mockImplementation((action) => action !== 'delete')

    const result = useAllPermissions([
      ['create', 'User'],
      ['read', 'User'],
      ['delete', 'User'],
    ])

    expect(result.value).toBe(false)
  })
})
