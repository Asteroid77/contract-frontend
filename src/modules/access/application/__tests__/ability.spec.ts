import { describe, expect, it, vi } from 'vitest'
import {
  can,
  cannot,
  clearAbility,
  createAbility,
  defineAbilityFor,
  updateAbility,
} from '@/modules/access/application/ability'

describe('access ability', () => {
  it('createAbility starts without permissions', () => {
    const a = createAbility()

    expect(a.can('read', 'User')).toBe(false)
    expect(a.can('manage', 'all')).toBe(false)
  })

  it('defineAbilityFor grants full access for admin role', () => {
    const ability = defineAbilityFor([], [
      {
        id: 1,
        name: 'admin',
        description: 'admin role',
        permissions: [],
      },
    ])

    expect(ability.can('manage', 'all')).toBe(true)
    expect(ability.can('delete', 'User')).toBe(true)
    expect(ability.can('approve', 'Approval')).toBe(true)
  })

  it('defineAbilityFor parses direct and role permissions including wildcard', () => {
    const ability = defineAbilityFor(
      [
        { id: 1, name: 'user:create', description: 'create user' },
        { id: 2, name: 'approval:*', description: 'approval all actions' },
      ],
      [
        {
          id: 2,
          name: 'reviewer',
          description: 'review role',
          permissions: [{ id: 3, name: 'contract:read', description: 'read contract' }],
        },
      ],
    )

    expect(ability.can('create', 'User')).toBe(true)
    expect(ability.can('manage', 'Approval')).toBe(true)
    expect(ability.can('read', 'Contract')).toBe(true)
    expect(ability.can('delete', 'User')).toBe(false)
  })

  it('defineAbilityFor ignores invalid permission formats and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const ability = defineAbilityFor(
      [
        { id: 1, name: 'invalid-format', description: 'bad format' },
        { id: 2, name: 'unknown:create', description: 'bad subject' },
        { id: 3, name: 'user:invalid', description: 'bad action' },
      ],
      [],
    )

    expect(ability.can('create', 'User')).toBe(false)
    expect(warnSpy).toHaveBeenCalledTimes(3)

    warnSpy.mockRestore()
  })

  it('updateAbility and clearAbility operate on global ability helpers', () => {
    clearAbility()

    updateAbility([{ id: 1, name: 'user:read', description: 'read user' }], [])

    expect(can('read', 'User')).toBe(true)
    expect(cannot('delete', 'User')).toBe(true)

    clearAbility()

    expect(can('read', 'User')).toBe(false)
    expect(cannot('read', 'User')).toBe(true)
  })
})
