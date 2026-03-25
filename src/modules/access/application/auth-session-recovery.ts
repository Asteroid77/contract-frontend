import { getActivePinia } from 'pinia'
import { BusinessError } from '@/modules/shared/domain/errors'
import {
  clearAuthTokens,
  getStoredAccessToken,
  getStoredRefreshToken,
  isLogoutInProgress,
} from './token-manager'

let authSessionRecoveryPromise: Promise<void> | null = null

export function isRecoverableAuthSessionError(error: unknown): error is BusinessError {
  return error instanceof BusinessError && error.status === 401
}

function hasStoredSession(): boolean {
  return Boolean(getStoredAccessToken() || getStoredRefreshToken())
}

async function clearSessionState(): Promise<void> {
  const activePinia = getActivePinia()

  if (!activePinia) {
    clearAuthTokens()
    return
  }

  try {
    const { useAccountStore } = await import('@/modules/user/application/stores/useAccountStore')
    await Promise.resolve(useAccountStore(activePinia).clearSession())
  } catch {
    clearAuthTokens()
  }
}

export async function recoverAuthSession(error: unknown): Promise<void> {
  if (
    !isRecoverableAuthSessionError(error) ||
    isLogoutInProgress() ||
    !hasStoredSession()
  ) {
    return
  }

  if (!authSessionRecoveryPromise) {
    authSessionRecoveryPromise = clearSessionState().finally(() => {
      authSessionRecoveryPromise = null
    })
  }

  await authSessionRecoveryPromise
}

export function resetAuthSessionRecoveryStateForTests(): void {
  authSessionRecoveryPromise = null
}
