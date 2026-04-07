import { describe, expect, it } from 'vitest'
import { ResponseCode } from '@/modules/shared/application/constants/response-code'
import { shouldClearSessionForRefreshFailure } from '@/modules/access/application/refresh-failure-classifier'

const buildAxiosProblemError = ({
  status,
  code,
  data,
}: {
  status: number
  code: number
  data?: Record<string, unknown>
}) => ({
  isAxiosError: true,
  response: {
    status,
    data: {
      type: 'about:blank',
      title: 'problem',
      status,
      detail: 'problem',
      code,
      data,
    },
    headers: {
      'content-type': 'application/problem+json;charset=UTF-8',
    },
  },
})

const buildAxiosHtmlError = (status: number, html: string) => ({
  isAxiosError: true,
  response: {
    status,
    data: html,
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  },
})

describe('refresh-failure-classifier', () => {
  it('returns true for backend invalid-grant refresh failures', () => {
    const error = buildAxiosProblemError({
      status: 400,
      code: ResponseCode.AUTH_REFRESH_GRANT_INVALID,
      data: {
        oauthError: 'invalid_grant',
        reason: 'refresh_token_revoked',
      },
    })

    expect(shouldClearSessionForRefreshFailure(error)).toBe(true)
  })

  it('returns false for unexpected refresh 401 responses', () => {
    const error = buildAxiosProblemError({
      status: 401,
      code: ResponseCode.AUTH_ACCESS_TOKEN_EXPIRED,
    })

    expect(shouldClearSessionForRefreshFailure(error)).toBe(false)
  })

  it('returns false for forbidden origin failures', () => {
    const error = buildAxiosProblemError({
      status: 403,
      code: ResponseCode.AUTH_REQUEST_ORIGIN_INVALID,
    })

    expect(shouldClearSessionForRefreshFailure(error)).toBe(false)
  })

  it('returns false for non-problem proxy responses', () => {
    const error = buildAxiosHtmlError(403, '<html>forbidden</html>')

    expect(shouldClearSessionForRefreshFailure(error)).toBe(false)
  })
})
