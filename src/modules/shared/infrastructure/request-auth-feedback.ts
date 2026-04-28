import axios from 'axios'
import { showUniqueErrorNotification } from '@/_utils/discrete_naive_api'
import { $t } from '@/_utils/i18n'
import { BusinessError } from '@/modules/shared/domain/errors'
import { ResponseCode } from '@/modules/shared/application/constants/response-code'
import type { RFC7807Response } from '@/modules/shared/domain/response'

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

function buildRefreshFailureKey(error: unknown): string {
  if (error instanceof BusinessError) {
    return `refresh-failure:${error.status}:${error.code}`
  }

  if (axios.isAxiosError(error) && error.response) {
    const payload = error.response.data as RFC7807Response | undefined
    const contentType = String(error.response.headers?.['content-type'] ?? '')
    const status = error.response.status ?? payload?.status ?? 0
    const code = payload?.code

    if (contentType.includes('application/problem+json') && code !== undefined) {
      return `refresh-failure:${status}:${code}`
    }

    return `refresh-failure:non-problem:${status}`
  }

  return 'refresh-failure:unknown'
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

export function reportRefreshFailureFeedback(error: unknown): void {
  if (error instanceof BusinessError) {
    if (error.status === 400 && error.code === ResponseCode.AUTH_REFRESH_GRANT_INVALID) {
      return
    }

    const key = buildRefreshFailureKey(error)
    if (isInAuthFeedbackCooldown(key, 403)) {
      return
    }

    markAuthFeedbackShown(key)
    const content =
      error.status === 403 ? `续期请求被拒绝：${error.message}` : '登录续期失败，请重试'

    showUniqueErrorNotification(key, {
      title: '登录续期失败',
      content,
      duration: 5000,
      keepAliveOnHover: true,
    })
    return
  }

  if (!axios.isAxiosError(error) || !error.response) {
    return
  }

  const key = buildRefreshFailureKey(error)
  if (isInAuthFeedbackCooldown(key, 403)) {
    return
  }

  markAuthFeedbackShown(key)
  const payload = error.response.data as RFC7807Response | undefined
  const contentType = String(error.response.headers?.['content-type'] ?? '')
  const detail = contentType.includes('application/problem+json')
    ? payload?.detail || payload?.title || '登录续期失败，请重试'
    : '续期请求未返回标准错误体，优先检查本地代理、CORS 或网关配置。'

  showUniqueErrorNotification(key, {
    title: '登录续期失败',
    content: contentType.includes('application/problem+json')
      ? `续期请求被拒绝：${detail}`
      : detail,
    duration: 5000,
    keepAliveOnHover: true,
  })
}

export function resetAuthFeedbackStateForTests(): void {
  lastAuthFeedbackAt.clear()
}
