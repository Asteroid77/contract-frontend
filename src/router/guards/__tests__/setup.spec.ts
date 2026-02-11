import { describe, expect, it, vi } from 'vitest'
import { setupGuards } from '@/router/guards/setup'
import { setupLoadingBarGuards } from '@/router/guards/SetupLoadingBarGuards'
import { setupAuthGuards } from '@/router/guards/SetupAuthGuard'
import { setupAbilityGuard } from '@/router/guards/SetupAbilityGuard'

vi.mock('@/router/guards/SetupLoadingBarGuards', () => ({
  setupLoadingBarGuards: vi.fn(),
}))

vi.mock('@/router/guards/SetupAuthGuard', () => ({
  setupAuthGuards: vi.fn(),
}))

vi.mock('@/router/guards/SetupAbilityGuard', () => ({
  setupAbilityGuard: vi.fn(),
}))

describe('setupGuards', () => {
  it('registers guards in expected order', () => {
    const router = {} as Parameters<typeof setupGuards>[0]

    setupGuards(router)

    expect(setupLoadingBarGuards).toHaveBeenCalledWith(router)
    expect(setupAuthGuards).toHaveBeenCalledWith(router)
    expect(setupAbilityGuard).toHaveBeenCalledWith(router)

    const loadingOrder = vi.mocked(setupLoadingBarGuards).mock.invocationCallOrder[0]
    const authOrder = vi.mocked(setupAuthGuards).mock.invocationCallOrder[0]
    const abilityOrder = vi.mocked(setupAbilityGuard).mock.invocationCallOrder[0]

    expect(loadingOrder).toBeLessThan(authOrder)
    expect(authOrder).toBeLessThan(abilityOrder)
  })
})
