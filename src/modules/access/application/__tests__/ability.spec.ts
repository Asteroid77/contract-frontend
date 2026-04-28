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

  it('defineAbilityFor does not grant full access by role name and still reads role permissions', () => {
    const ability = defineAbilityFor(
      [],
      [
        {
          id: 1,
          name: 'admin',
          description: 'admin role',
          permissions: [{ id: 2, name: 'user:read', description: 'read user' }],
        },
      ],
    )

    expect(ability.can('manage', 'all')).toBe(false)
    expect(ability.can('read', 'User')).toBe(true)
    expect(ability.can('delete', 'User')).toBe(false)
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

  it('defineAbilityFor supports action-first format and alias actions', () => {
    const ability = defineAbilityFor(
      [
        { id: 1, name: 'view:user', description: 'view user' },
        { id: 2, name: 'edit:user', description: 'edit user' },
        { id: 3, name: 'disabled:user', description: 'disable user' },
        { id: 4, name: 'list:user', description: 'list user' },
      ],
      [],
    )

    expect(ability.can('read', 'User')).toBe(true)
    expect(ability.can('update', 'User')).toBe(true)
    expect(ability.can('delete', 'User')).toBe(true)
  })

  it('defineAbilityFor accepts backend action permissions and multi-segment subjects', () => {
    const ability = defineAbilityFor(
      [
        { id: 1, name: 'page:user', description: 'page user' },
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
          name: 'preview:service-agreement-attachments',
          description: 'preview service agreement attachments',
        },
        {
          id: 9,
          name: 'view:agent-dashboard:global',
          description: 'view global agent dashboard',
        },
      ],
      [],
    )

    expect(ability.can('read', 'User')).toBe(true)
    expect(ability.can('assign', 'UserRole')).toBe(true)
    expect(ability.can('claim', 'ApprovalTask')).toBe(true)
    expect(ability.can('handle', 'ApprovalTask')).toBe(true)
    expect(ability.can('record', 'ServiceAgreement')).toBe(true)
    expect(ability.can('duplicate-check', 'ServiceAgreement')).toBe(true)
    expect(ability.can('upload', 'ServiceAgreementFile')).toBe(true)
    expect(ability.can('read', 'ServiceAgreementAttachments')).toBe(true)
    expect(ability.can('read', 'AgentDashboardGlobal')).toBe(true)
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
