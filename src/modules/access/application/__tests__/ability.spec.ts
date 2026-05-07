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

    expect(a.can('read', 'user')).toBe(false)
    expect(a.can('manage', 'all')).toBe(false)
  })

  it('defineAbilityFor does not grant full access by role name and still reads canonical role permissions', () => {
    const ability = defineAbilityFor(
      [],
      [
        {
          id: 1,
          name: 'admin',
          description: 'admin role',
          permissions: [{ id: 2, name: 'read:user', description: 'read user' }],
        },
      ],
    )

    expect(ability.can('manage', 'all')).toBe(false)
    expect(ability.can('read', 'user')).toBe(true)
    expect(ability.can('delete', 'user')).toBe(false)
  })

  it('defineAbilityFor parses direct and role canonical permissions', () => {
    const ability = defineAbilityFor(
      [
        { id: 1, name: 'create:user', description: 'create user' },
        {
          id: 2,
          name: 'manage:work-order-category',
          description: 'manage work order category',
        },
      ],
      [
        {
          id: 2,
          name: 'reviewer',
          description: 'review role',
          permissions: [{ id: 3, name: 'read:service-agreement', description: 'read contract' }],
        },
      ],
    )

    expect(ability.can('create', 'user')).toBe(true)
    expect(ability.can('manage', 'work-order-category')).toBe(true)
    expect(ability.can('read', 'service-agreement')).toBe(true)
    expect(ability.can('delete', 'user')).toBe(false)
  })

  it('defineAbilityFor silently ignores known legacy permissions without granting access', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const ability = defineAbilityFor(
      [
        { id: 1, name: 'user:read', description: 'subject first user read' },
        { id: 2, name: 'view:user', description: 'view user' },
        { id: 3, name: 'edit:user', description: 'edit user' },
        { id: 4, name: 'disabled:user', description: 'disable user' },
        { id: 5, name: 'list:user', description: 'list user' },
      ],
      [],
    )

    expect(ability.can('read', 'user')).toBe(false)
    expect(ability.can('update', 'user')).toBe(false)
    expect(ability.can('delete', 'user')).toBe(false)
    expect(warnSpy).not.toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  it('defineAbilityFor accepts backend canonical permissions and multi-segment subjects', () => {
    const ability = defineAbilityFor(
      [
        { id: 1, name: 'read:user-page', description: 'page user' },
        { id: 2, name: 'assign:user-role', description: 'assign user role' },
        { id: 3, name: 'claim:approval-task', description: 'claim approval task' },
        { id: 4, name: 'handle:approval-task', description: 'handle approval task' },
        { id: 5, name: 'record:service-agreement', description: 'record service agreement' },
        {
          id: 6,
          name: 'duplicate-check:service-agreement',
          description: 'duplicate check service agreement',
        },
        {
          id: 7,
          name: 'upload:service-agreement-file',
          description: 'upload service agreement file',
        },
        {
          id: 8,
          name: 'read:service-agreement-attachments',
          description: 'preview service agreement attachments',
        },
        {
          id: 9,
          name: 'read:agent-dashboard:global',
          description: 'view global agent dashboard',
        },
        {
          id: 10,
          name: 'handle:work-order:filing-contract',
          description: 'handle work order filing contract',
        },
      ],
      [],
    )

    expect(ability.can('read', 'user-page')).toBe(true)
    expect(ability.can('assign', 'user-role')).toBe(true)
    expect(ability.can('claim', 'approval-task')).toBe(true)
    expect(ability.can('handle', 'approval-task')).toBe(true)
    expect(ability.can('record', 'service-agreement')).toBe(true)
    expect(ability.can('duplicate-check', 'service-agreement')).toBe(true)
    expect(ability.can('upload', 'service-agreement-file')).toBe(true)
    expect(ability.can('read', 'service-agreement-attachments')).toBe(true)
    expect(ability.can('read', 'agent-dashboard:global')).toBe(true)
    expect(ability.can('handle', 'work-order:filing-contract')).toBe(true)
  })

  it('defineAbilityFor ignores invalid permission formats and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const ability = defineAbilityFor(
      [
        { id: 1, name: 'invalid-format', description: 'bad format' },
        { id: 2, name: 'unknown:create', description: 'bad subject' },
        { id: 3, name: 'invalid:user', description: 'bad action' },
        { id: 4, name: 'read:User', description: 'non canonical subject casing' },
      ],
      [],
    )

    expect(ability.can('create', 'user')).toBe(false)
    expect(ability.can('read', 'user')).toBe(false)
    expect(warnSpy).toHaveBeenCalledTimes(4)

    warnSpy.mockRestore()
  })

  it('updateAbility and clearAbility operate on global ability helpers', () => {
    clearAbility()

    updateAbility([{ id: 1, name: 'read:user', description: 'read user' }], [])

    expect(can('read', 'user')).toBe(true)
    expect(cannot('delete', 'user')).toBe(true)

    clearAbility()

    expect(can('read', 'user')).toBe(false)
    expect(cannot('read', 'user')).toBe(true)
  })
})
