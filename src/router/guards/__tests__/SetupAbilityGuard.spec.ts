import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setupAbilityGuard } from '@/router/guards/SetupAbilityGuard'
import { ability } from '@/modules/access/application/ability'
import { capturePermissionError } from '@/app/observability/lazy'

vi.mock('@/modules/access/application/ability', () => ({
  ability: {
    can: vi.fn(),
  },
}))

vi.mock('@/app/observability/lazy', () => ({
  capturePermissionError: vi.fn(),
}))

type GuardHandler = (to: { name?: string; meta: Record<string, unknown> }) => unknown

const setupGuard = () => {
  const beforeEach = vi.fn()
  const router = {
    beforeEach,
  } as unknown as Parameters<typeof setupAbilityGuard>[0]

  setupAbilityGuard(router)

  const guard = beforeEach.mock.calls[0][0] as GuardHandler
  return { guard }
}

describe('setupAbilityGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(ability.can).mockReturnValue(true)
  })

  it('allows route when ability meta is missing', () => {
    const { guard } = setupGuard()

    expect(guard({ name: 'dashboard', meta: {} })).toBe(true)
    expect(ability.can).not.toHaveBeenCalled()
  })

  it('allows route when single ability rule passes', () => {
    const { guard } = setupGuard()

    const result = guard({
      name: 'user-settings',
      meta: {
        ability: {
          action: 'read',
          subject: 'User',
        },
      },
    })

    expect(result).toBe(true)
    expect(ability.can).toHaveBeenCalledWith('read', 'User')
  })

  it('blocks route when single ability rule fails', () => {
    vi.mocked(ability.can).mockReturnValue(false)
    const { guard } = setupGuard()

    const result = guard({
      name: 'user-settings',
      meta: {
        ability: {
          action: 'read',
          subject: 'User',
        },
      },
    })

    expect(result).toEqual({ name: '403' })
    expect(capturePermissionError).toHaveBeenCalledWith(
      'read',
      'User',
      'Route access denied: user-settings',
    )
  })

  it('blocks route when any ability rule in array fails', () => {
    vi.mocked(ability.can).mockImplementation((action) => action === 'read')
    const { guard } = setupGuard()

    const result = guard({
      name: 'approval-node-list',
      meta: {
        ability: [
          {
            action: 'read',
            subject: 'User',
          },
          {
            action: 'manage',
            subject: 'Permission',
          },
        ],
      },
    })

    expect(result).toEqual({ name: '403' })
    expect(capturePermissionError).toHaveBeenCalledWith(
      'manage',
      'Permission',
      'Route access denied: approval-node-list',
    )
  })
})
