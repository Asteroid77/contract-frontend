import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { BusinessError } from '@/modules/shared/domain/errors'
import { STORAGE_KEYS } from '@/constants/storage'
import {
  isRecoverableAuthSessionError,
  recoverAuthSession,
  resetAuthSessionRecoveryStateForTests,
} from '@/modules/access/application/auth-session-recovery'

const { clearSessionSpy } = vi.hoisted(() => ({
  clearSessionSpy: vi.fn(),
}))

vi.mock('@/modules/user/application/stores/useAccountStore', () => ({
  useAccountStore: () => ({
    clearSession: clearSessionSpy,
  }),
}))

describe('auth-session-recovery', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    clearSessionSpy.mockReset()
    resetAuthSessionRecoveryStateForTests()
  })

  it('recognizes only 401 business errors as recoverable auth session errors', () => {
    expect(
      isRecoverableAuthSessionError(
        new BusinessError('expired', 40100, 'trace-1', 'req-1', 'about:blank', 401),
      ),
    ).toBe(true)
    expect(
      isRecoverableAuthSessionError(
        new BusinessError('forbidden', 40300, 'trace-2', 'req-2', 'about:blank', 403),
      ),
    ).toBe(false)
  })

  it('clears session for recoverable 401 errors when local session exists', async () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-token')

    await recoverAuthSession(
      new BusinessError('expired', 40100, 'trace-1', 'req-1', 'about:blank', 401),
    )

    expect(clearSessionSpy).toHaveBeenCalledTimes(1)
  })

  it('does nothing for 403 errors', async () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-token')

    await recoverAuthSession(
      new BusinessError('forbidden', 40300, 'trace-2', 'req-2', 'about:blank', 403),
    )

    expect(clearSessionSpy).not.toHaveBeenCalled()
  })

  it('does nothing when local session does not exist', async () => {
    await recoverAuthSession(
      new BusinessError('expired', 40100, 'trace-1', 'req-1', 'about:blank', 401),
    )

    expect(clearSessionSpy).not.toHaveBeenCalled()
  })

  it('coalesces concurrent recovery calls into one session cleanup', async () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-token')
    clearSessionSpy.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(resolve, 10)
        }),
    )

    const error = new BusinessError('expired', 40100, 'trace-1', 'req-1', 'about:blank', 401)

    await Promise.all([
      recoverAuthSession(error),
      recoverAuthSession(error),
      recoverAuthSession(error),
    ])

    expect(clearSessionSpy).toHaveBeenCalledTimes(1)
  })
})
