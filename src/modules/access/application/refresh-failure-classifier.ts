import axios from 'axios'
import type { RFC7807Response } from '@/modules/shared/domain/response'
import { ResponseCode } from '@/modules/shared/application/constants/response-code'

export const shouldClearSessionForRefreshFailure = (error: unknown): boolean => {
  if (!axios.isAxiosError(error) || !error.response) {
    return false
  }

  const payload = error.response.data as RFC7807Response | undefined
  const contentType = String(error.response.headers?.['content-type'] ?? '')
  const isProblemJson = contentType.includes('application/problem+json')
  const isProblemPayload =
    typeof payload?.status === 'number' &&
    typeof payload?.code === 'number' &&
    typeof payload?.title === 'string'
  const status = error.response.status ?? payload?.status
  const code = payload?.code
  const oauthError = (payload?.data as { oauthError?: string } | undefined)?.oauthError

  return (
    (isProblemJson || isProblemPayload) &&
    status === 400 &&
    code === ResponseCode.AUTH_REFRESH_GRANT_INVALID &&
    oauthError === 'invalid_grant'
  )
}
