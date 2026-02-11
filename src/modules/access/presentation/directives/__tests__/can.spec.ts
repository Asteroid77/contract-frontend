import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DirectiveBinding } from 'vue'
import canDirective from '@/modules/access/presentation/directives/can'
import { ability } from '@/modules/access/application/ability'
import { capturePermissionError } from '@/app/observability'

vi.mock('@/modules/access/application/ability', () => ({
  ability: {
    can: vi.fn(),
  },
}))

vi.mock('@/app/observability', () => ({
  capturePermissionError: vi.fn(),
}))

const makeBinding = (
  value: string | string[],
  arg?: string,
): DirectiveBinding<string | string[]> =>
  ({
    value,
    arg,
  }) as DirectiveBinding<string | string[]>

const createMockEl = () => ({
  remove: vi.fn(),
}) as unknown as HTMLElement

describe('v-can directive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps element when single permission is granted', () => {
    vi.mocked(ability.can).mockReturnValue(true)

    const el = createMockEl()

    ;(canDirective as any).mounted?.(el, makeBinding('read:User'))

    expect(ability.can).toHaveBeenCalledWith('read', 'User')
    expect(el.remove).not.toHaveBeenCalled()
    expect(capturePermissionError).not.toHaveBeenCalled()
  })

  it('removes element and captures error when single permission is denied', () => {
    vi.mocked(ability.can).mockReturnValue(false)

    const el = createMockEl()

    ;(canDirective as any).mounted?.(el, makeBinding('delete:User'))

    expect(ability.can).toHaveBeenCalledWith('delete', 'User')
    expect(el.remove).toHaveBeenCalledTimes(1)
    expect(capturePermissionError).toHaveBeenCalledWith('delete', 'User', 'Directive check failed')
  })

  it('uses AND logic for permission arrays by default', () => {
    vi.mocked(ability.can).mockImplementation((action, subject) => action === 'read' && subject === 'User')

    const el = createMockEl()

    ;(canDirective as any).updated?.(el, makeBinding(['read:User', 'update:User']))

    expect(el.remove).toHaveBeenCalledTimes(1)
    expect(capturePermissionError).toHaveBeenCalledWith(
      'read, update',
      'User, User',
      'Directive check failed (AND logic)',
    )
  })

  it('uses OR logic when arg is any', () => {
    vi.mocked(ability.can).mockImplementation((action, subject) => action === 'read' && subject === 'User')

    const el = createMockEl()

    ;(canDirective as any).updated?.(el, makeBinding(['read:User', 'delete:User'], 'any'))

    expect(el.remove).not.toHaveBeenCalled()
    expect(capturePermissionError).not.toHaveBeenCalled()
  })
})
