import { showUniqueErrorNotification } from '@/_utils/discrete_naive_api'
import { $t } from '@/_utils/i18n'
import { BusinessError } from '@/modules/shared/domain/errors'

const AUTH_ERROR_STATUSES = new Set([401, 403])
const AUTH_FEEDBACK_COOLDOWN_MS = {
  401: 15000,
  403: 5000,
} as const
const lastAuthFeedbackAt = new Map<string, number>()

export function isAuthFeedbackError(error: unknown): error is BusinessError {
  return error instanceof BusinessError && AUTH_ERROR_STATUSES.has(error.status)
}

export function buildAuthFeedbackKey(error: BusinessError): string {
  if (error.status === 401) {
    return 'auth:401:session-expired'
  }

  if (error.code !== undefined && error.code !== null) {
    return `auth:403:code:${error.code}`
  }

  return 'auth:403:forbidden'
}

function isInAuthFeedbackCooldown(key: string, status: 401 | 403): boolean {
  const lastShownAt = lastAuthFeedbackAt.get(key)

  if (lastShownAt === undefined) {
    return false
  }

  return Date.now() - lastShownAt < AUTH_FEEDBACK_COOLDOWN_MS[status]
}

function markAuthFeedbackShown(key: string): void {
  lastAuthFeedbackAt.set(key, Date.now())
}

export function reportAuthErrorFeedback(error: unknown): void {
  if (!isAuthFeedbackError(error)) {
    return
  }

  const key = buildAuthFeedbackKey(error)

  if (error.status === 401) {
    if (isInAuthFeedbackCooldown(key, 401)) {
      return
    }

    markAuthFeedbackShown(key)
    showUniqueErrorNotification(key, {
      title: $t('auth.error.tokenExpired'),
      content: $t('auth.error.tokenExpiredMeta'),
      duration: 5000,
      keepAliveOnHover: true,
    })
    return
  }

  if (isInAuthFeedbackCooldown(key, 403)) {
    return
  }

  markAuthFeedbackShown(key)
  showUniqueErrorNotification(key, {
    title: $t('common.error.403'),
    content: $t('common.error.403Desc'),
    duration: 5000,
    keepAliveOnHover: true,
  })
}

export function resetAuthFeedbackStateForTests(): void {
  lastAuthFeedbackAt.clear()
}
