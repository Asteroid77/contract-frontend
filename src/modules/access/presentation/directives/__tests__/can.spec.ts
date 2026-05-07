import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DirectiveBinding } from 'vue'
import canDirective from '@/modules/access/presentation/directives/can'
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

const makeBinding = (value: string | string[], arg?: string): DirectiveBinding<string | string[]> =>
  ({
    value,
    arg,
  }) as DirectiveBinding<string | string[]>

const createMockEl = () =>
  ({
    remove: vi.fn(),
  }) as unknown as HTMLElement

type CanDirectiveHooks = {
  mounted?: (el: HTMLElement, binding: DirectiveBinding<string | string[]>) => void
  updated?: (el: HTMLElement, binding: DirectiveBinding<string | string[]>) => void
}

const typedCanDirective = canDirective as CanDirectiveHooks

describe('v-can directive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps element when single permission is granted', () => {
    vi.mocked(ability.can).mockReturnValue(true)

    const el = createMockEl()

    typedCanDirective.mounted?.(el, makeBinding('read:user'))

    expect(ability.can).toHaveBeenCalledWith('read', 'user')
    expect(el.remove).not.toHaveBeenCalled()
    expect(capturePermissionError).not.toHaveBeenCalled()
  })

  it('keeps element when scoped canonical permission is granted', () => {
    vi.mocked(ability.can).mockReturnValue(true)

    const el = createMockEl()

    typedCanDirective.mounted?.(el, makeBinding('read:agent-dashboard:global'))

    expect(ability.can).toHaveBeenCalledWith('read', 'agent-dashboard:global')
    expect(el.remove).not.toHaveBeenCalled()
    expect(capturePermissionError).not.toHaveBeenCalled()
  })

  it('removes element and captures error when single permission is denied', () => {
    vi.mocked(ability.can).mockReturnValue(false)

    const el = createMockEl()

    typedCanDirective.mounted?.(el, makeBinding('delete:user'))

    expect(ability.can).toHaveBeenCalledWith('delete', 'user')
    expect(el.remove).toHaveBeenCalledTimes(1)
    expect(capturePermissionError).toHaveBeenCalledWith('delete', 'user', 'Directive check failed')
  })

  it('uses AND logic for permission arrays by default', () => {
    vi.mocked(ability.can).mockImplementation(
      (action, subject) => action === 'read' && subject === 'user',
    )

    const el = createMockEl()

    typedCanDirective.updated?.(el, makeBinding(['read:user', 'update:user']))

    expect(el.remove).toHaveBeenCalledTimes(1)
    expect(capturePermissionError).toHaveBeenCalledWith(
      'read, update',
      'user, user',
      'Directive check failed (AND logic)',
    )
  })

  it('uses OR logic when arg is any', () => {
    vi.mocked(ability.can).mockImplementation(
      (action, subject) => action === 'read' && subject === 'user',
    )

    const el = createMockEl()

    typedCanDirective.updated?.(el, makeBinding(['read:user', 'delete:user'], 'any'))

    expect(el.remove).not.toHaveBeenCalled()
    expect(capturePermissionError).not.toHaveBeenCalled()
  })
})
