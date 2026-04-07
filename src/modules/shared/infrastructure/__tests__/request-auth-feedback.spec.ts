import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BusinessError } from '@/modules/shared/domain/errors'
import { showUniqueErrorNotification } from '@/_utils/discrete_naive_api'
import {
  buildAuthFeedbackKey,
  isAuthFeedbackError,
  reportRefreshFailureFeedback,
  reportAuthErrorFeedback,
  resetAuthFeedbackStateForTests,
} from '@/modules/shared/infrastructure/request-auth-feedback'
import { ResponseCode } from '@/modules/shared/application/constants/response-code'

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
    expect(
      isAuthFeedbackError(
        new BusinessError('expired', 40100, 'trace-1', 'req-1', 'about:blank', 401),
      ),
    ).toBe(true)
    expect(
      isAuthFeedbackError(
        new BusinessError('forbidden', 40300, 'trace-2', 'req-2', 'about:blank', 403),
      ),
    ).toBe(true)
    expect(
      isAuthFeedbackError(
        new BusinessError('bad-request', 40000, 'trace-3', 'req-3', 'about:blank', 400),
      ),
    ).toBe(false)
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
    const second = new BusinessError(
      'forbidden again',
      40300,
      'trace-2',
      'req-2',
      'about:blank',
      403,
    )

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

  it('reports refresh origin failures with explicit backend detail', () => {
    const error = new BusinessError(
      '请求来源校验失败',
      ResponseCode.AUTH_REQUEST_ORIGIN_INVALID,
      'trace-3',
      'req-3',
      'about:blank',
      403,
    )

    reportRefreshFailureFeedback(error)

    expect(showUniqueErrorNotification).toHaveBeenCalledWith(
      'refresh-failure:403:20009',
      expect.objectContaining({
        title: '登录续期失败',
        content: '续期请求被拒绝：请求来源校验失败',
      }),
    )
  })

  it('reports non-problem refresh failures with development hint copy', () => {
    reportRefreshFailureFeedback({
      isAxiosError: true,
      response: {
        status: 403,
        data: '<html>forbidden</html>',
        headers: {
          'content-type': 'text/html;charset=UTF-8',
        },
      },
    })

    expect(showUniqueErrorNotification).toHaveBeenCalledWith(
      'refresh-failure:non-problem:403',
      expect.objectContaining({
        title: '登录续期失败',
        content: '续期请求未返回标准错误体，优先检查本地代理、CORS 或网关配置。',
      }),
    )
  })
})
