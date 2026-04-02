import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BusinessError } from '@/modules/shared/domain/errors'
import { showUniqueErrorNotification } from '@/_utils/discrete_naive_api'
import {
  buildAuthFeedbackKey,
  isAuthFeedbackError,
  reportAuthErrorFeedback,
  resetAuthFeedbackStateForTests,
} from '@/modules/shared/infrastructure/request-auth-feedback'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
}))

vi.mock('@/_utils/discrete_naive_api', () => ({
  showUniqueErrorNotification: vi.fn(),
}))

describe('request-auth-feedback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-19T00:00:00.000Z'))
    vi.clearAllMocks()
    resetAuthFeedbackStateForTests()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('recognizes 401 and 403 business errors as auth feedback errors', () => {
    expect(isAuthFeedbackError(new BusinessError('expired', 40100, 'trace-1', 'req-1', 'about:blank', 401)))
      .toBe(true)
    expect(isAuthFeedbackError(new BusinessError('forbidden', 40300, 'trace-2', 'req-2', 'about:blank', 403)))
      .toBe(true)
    expect(isAuthFeedbackError(new BusinessError('bad-request', 40000, 'trace-3', 'req-3', 'about:blank', 400)))
      .toBe(false)
  })

  it('builds a stable 401 auth feedback key from cause instead of request id', () => {
    const error = new BusinessError('expired', 40100, 'trace-1', 'req-1', 'about:blank', 401)

    expect(buildAuthFeedbackKey(error)).toBe('auth:401:session-expired')
  })

  it('builds a stable 403 auth feedback key from status code and business code without request id', () => {
    const error = new BusinessError('forbidden', 40300, 'trace-2', 'req-2', 'about:blank', 403)

    expect(buildAuthFeedbackKey(error)).toBe('auth:403:code:40300')
  })

  it('reports 401 with token-expired copy', () => {
    const error = new BusinessError('expired', 40100, 'trace-1', 'req-1', 'about:blank', 401)

    reportAuthErrorFeedback(error)

    expect(showUniqueErrorNotification).toHaveBeenCalledWith(
      'auth:401:session-expired',
      expect.objectContaining({
        title: 't:auth.error.tokenExpired',
        content: 't:auth.error.tokenExpiredMeta',
      }),
    )
  })

  it('reports 403 with permission copy', () => {
    const error = new BusinessError('forbidden', 40300, 'trace-2', 'req-2', 'about:blank', 403)

    reportAuthErrorFeedback(error)

    expect(showUniqueErrorNotification).toHaveBeenCalledWith(
      'auth:403:code:40300',
      expect.objectContaining({
        title: 't:common.error.403',
        content: 't:common.error.403Desc',
      }),
    )
  })

  it('suppresses repeated 401 feedback inside cooldown window', () => {
    const first = new BusinessError('expired', 40100, 'trace-1', 'req-1', 'about:blank', 401)
    const second = new BusinessError('expired again', 40100, 'trace-2', 'req-2', 'about:blank', 401)

    reportAuthErrorFeedback(first)
    reportAuthErrorFeedback(second)

    expect(showUniqueErrorNotification).toHaveBeenCalledTimes(1)
  })

  it('allows 401 feedback again after cooldown window passes', () => {
    const first = new BusinessError('expired', 40100, 'trace-1', 'req-1', 'about:blank', 401)
    const second = new BusinessError('expired again', 40100, 'trace-2', 'req-2', 'about:blank', 401)

    reportAuthErrorFeedback(first)
    vi.advanceTimersByTime(15001)
    reportAuthErrorFeedback(second)

    expect(showUniqueErrorNotification).toHaveBeenCalledTimes(2)
  })

  it('suppresses repeated 403 feedback inside cooldown window even when request ids differ', () => {
    const first = new BusinessError('forbidden', 40300, 'trace-1', 'req-1', 'about:blank', 403)
    const second = new BusinessError('forbidden again', 40300, 'trace-2', 'req-2', 'about:blank', 403)

    reportAuthErrorFeedback(first)
    reportAuthErrorFeedback(second)

    expect(showUniqueErrorNotification).toHaveBeenCalledTimes(1)
  })

  it('treats 401 and 403 as different auth feedback causes', () => {
    const unauthorized = new BusinessError('expired', 40100, 'trace-1', 'req-1', 'about:blank', 401)
    const forbidden = new BusinessError('forbidden', 40300, 'trace-2', 'req-2', 'about:blank', 403)

    reportAuthErrorFeedback(unauthorized)
    reportAuthErrorFeedback(forbidden)

    expect(showUniqueErrorNotification).toHaveBeenCalledTimes(2)
  })

  it('ignores non-auth business errors', () => {
    const error = new BusinessError('bad-request', 40000, 'trace-3', 'req-3', 'about:blank', 400)

    reportAuthErrorFeedback(error)

    expect(showUniqueErrorNotification).not.toHaveBeenCalled()
  })
})
