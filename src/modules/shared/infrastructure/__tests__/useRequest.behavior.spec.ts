import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { apiClient } from '@/app/infrastructure/request/http-client'
import { BusinessError } from '@/modules/shared/domain/errors'
import { ResponseCode } from '@/modules/shared/application/constants/response-code'
import { AUTH_ENDPOINTS } from '@/modules/access/infrastructure/auth-endpoints'
import { STORAGE_KEYS } from '@/constants/storage'

const { reportAuthErrorFeedbackSpy, reportRefreshFailureFeedbackSpy } = vi.hoisted(() => ({
  reportAuthErrorFeedbackSpy: vi.fn(),
  reportRefreshFailureFeedbackSpy: vi.fn(),
}))

const { isRecoverableAuthSessionErrorSpy, recoverAuthSessionSpy } = vi.hoisted(() => ({
  isRecoverableAuthSessionErrorSpy: vi.fn(
    (error: unknown) =>
      error instanceof BusinessError &&
      error.status === 401 &&
      !localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  ),
  recoverAuthSessionSpy: vi.fn(),
}))

vi.mock('@/modules/shared/infrastructure/request-auth-feedback', () => ({
  reportAuthErrorFeedback: reportAuthErrorFeedbackSpy,
  reportRefreshFailureFeedback: reportRefreshFailureFeedbackSpy,
}))

vi.mock('@/modules/access/application/auth-session-recovery', () => ({
  isRecoverableAuthSessionError: isRecoverableAuthSessionErrorSpy,
  recoverAuthSession: recoverAuthSessionSpy,
}))

let mock: AxiosMockAdapter

describe('useRequest behavior branches', () => {
  beforeEach(() => {
    mock = new AxiosMockAdapter(apiClient)
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    mock.restore()
    localStorage.clear()
  })

  it('returns axios response when responseShape is raw and injects response requestId', async () => {
    mock.onGet('/nowrap').reply(
      200,
      {
        type: 'about:blank',
        title: 'ok',
        status: 200,
        detail: 'ok',
        code: 0,
        traceId: 'trace-id-nowrap',
        data: { ok: true },
      },
      {
        'x-request-id': 'request-id-from-header',
      },
    )

    const result = await useRequest<{ ok: boolean }>({
      method: 'GET',
      url: '/nowrap',
      responseShape: 'raw',
    })

    expect(result.data.data.ok).toBe(true)
    expect(result.data.requestId).toBe('request-id-from-header')
  })

  it('returns axios response when responseShape is raw', async () => {
    mock.onGet('/shape-raw-priority').reply(
      200,
      {
        type: 'about:blank',
        title: 'ok',
        status: 200,
        detail: 'ok',
        code: 0,
        traceId: 'trace-id-raw-priority',
        data: { ok: true },
      },
      {
        'x-request-id': 'request-id-raw-priority',
      },
    )

    const result = await useRequest<{ ok: boolean }>({
      method: 'GET',
      url: '/shape-raw-priority',
      responseShape: 'raw',
    })

    expect(result.data.data.ok).toBe(true)
    expect(result.data.requestId).toBe('request-id-raw-priority')
  })

  it('returns envelope when responseShape is envelope', async () => {
    mock.onGet('/shape-envelope-priority').reply(
      200,
      {
        type: 'about:blank',
        title: 'ok',
        status: 200,
        detail: 'ok',
        code: 0,
        traceId: 'trace-id-envelope-priority',
        data: { ok: true },
      },
      {
        'x-request-id': 'request-id-envelope-priority',
      },
    )

    const result = await useRequest<{ ok: boolean }>({
      method: 'GET',
      url: '/shape-envelope-priority',
      responseShape: 'envelope',
    })

    expect(result.data.ok).toBe(true)
    expect(result.requestId).toBe('request-id-envelope-priority')
  })

  it('returns plain data when responseShape is data', async () => {
    mock.onGet('/shape-data').reply(200, {
      type: 'about:blank',
      title: 'ok',
      status: 200,
      detail: 'ok',
      code: 0,
      traceId: 'trace-id-data-shape',
      data: { ok: true },
    })

    const result = await useRequest<{ ok: boolean }>({
      method: 'GET',
      url: '/shape-data',
      responseShape: 'data',
    })

    expect(result.ok).toBe(true)
  })

  it('returns plain data by default when responseShape is omitted', async () => {
    mock.onGet('/shape-data-default').reply(200, {
      type: 'about:blank',
      title: 'ok',
      status: 200,
      detail: 'ok',
      code: 0,
      traceId: 'trace-id-data-default',
      data: { ok: true },
    })

    const result = await useRequest<{ ok: boolean }>({
      method: 'GET',
      url: '/shape-data-default',
    })

    expect(result.ok).toBe(true)
  })

  it('throws BusinessError when response body data is missing', async () => {
    mock.onGet('/missing-data').reply(200, {
      type: 'about:blank',
      title: 'missing data',
      status: 500,
      detail: 'payload is empty',
      code: 5001,
      traceId: 'trace-id-missing',
    })

    await expect(
      useRequest<{ ok: boolean }>({
        method: 'GET',
        url: '/missing-data',
        requestContext: {
          requestId: 'request-id-from-config',
        },
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<BusinessError>>({
        requestId: 'request-id-from-config',
        message: 'payload is empty',
      }),
    )
  })

  it('falls back to lowercase request-id header from request config', async () => {
    mock.onGet('/fallback-config').reply(200, {
      type: 'about:blank',
      title: 'ok',
      status: 200,
      detail: 'ok',
      code: 0,
      traceId: 'trace-id-fallback',
      data: { value: 1 },
    })

    const result = await useRequest<{ value: number }>({
      method: 'GET',
      url: '/fallback-config',
      headers: {
        'x-request-id': 'request-id-lowercase',
      },
      responseShape: 'envelope',
    })

    expect(result.requestId).toBe('request-id-lowercase')
    expect(result.data.value).toBe(1)
  })

  it('retries with refresh token on token-expired business code and replays request', async () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-old')
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-valid')

    let secureRequestCount = 0
    mock.onGet('/secure-retry').reply((config) => {
      secureRequestCount += 1

      if (secureRequestCount === 1) {
        expect(config.headers?.Authorization).toBe('access-old')
        return [
          401,
          {
            type: 'about:blank',
            title: 'token expired',
            status: 401,
            detail: 'access token expired',
            code: ResponseCode.AUTH_ACCESS_TOKEN_EXPIRED,
            traceId: 'trace-expired',
          },
        ]
      }

      expect(config.headers?.Authorization).toBe('access-new')
      return [
        200,
        {
          type: 'about:blank',
          title: 'ok',
          status: 200,
          detail: 'ok',
          code: 0,
          traceId: 'trace-replayed',
          data: { ok: true },
        },
      ]
    })

    mock.onPost(AUTH_ENDPOINTS.TOKEN_REFRESH).reply(200, {
      type: 'about:blank',
      title: 'ok',
      status: 200,
      detail: 'ok',
      code: 0,
      traceId: 'trace-refresh',
      data: {
        accessToken: 'access-new',
        refreshToken: 'refresh-new',
        expiresIn: 3600,
      },
    })

    const result = await useRequest<{ ok: boolean }>({
      method: 'GET',
      url: '/secure-retry',
    })

    expect(result.ok).toBe(true)
    expect(secureRequestCount).toBe(2)
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('access-new')
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-new')
    expect(mock.history.post).toHaveLength(1)
    expect(reportAuthErrorFeedbackSpy).not.toHaveBeenCalled()
  })

  it('reports auth feedback when refresh ultimately fails with 401', async () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-old')
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-old')

    mock.onGet('/secure-refresh-fail').reply(401, {
      type: 'about:blank',
      title: 'expired',
      status: 401,
      detail: 'access token expired',
      code: 401,
      traceId: 'trace-access-expired',
    })

    mock.onPost(AUTH_ENDPOINTS.TOKEN_REFRESH).reply(401, {
      type: 'about:blank',
      title: 'unauthorized',
      status: 401,
      detail: 'refresh token invalid',
      code: 401,
      traceId: 'trace-refresh-invalid',
    })

    await expect(
      useRequest<{ ok: boolean }>({
        method: 'GET',
        url: '/secure-refresh-fail',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<BusinessError>>({
        status: 401,
        message: 'refresh token invalid',
      }),
    )

    expect(reportAuthErrorFeedbackSpy).toHaveBeenCalledTimes(1)
    expect(reportAuthErrorFeedbackSpy).toHaveBeenCalledWith(
      expect.objectContaining<Partial<BusinessError>>({
        status: 401,
        message: 'refresh token invalid',
      }),
    )
    expect(reportRefreshFailureFeedbackSpy).toHaveBeenCalledTimes(1)
    expect(recoverAuthSessionSpy).not.toHaveBeenCalled()
  })

  it('does not inject token or trigger refresh when authMode is passthrough', async () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-old')
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-old')

    mock.onGet('/public-auth-mode').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined()
      return [
        401,
        {
          type: 'about:blank',
          title: 'unauthorized',
          status: 401,
          detail: 'public endpoint unauthorized',
          code: ResponseCode.AUTH_ACCESS_TOKEN_INVALID,
          traceId: 'trace-public-auth-mode',
        },
      ]
    })

    await expect(
      useRequest<{ ok: boolean }>({
        method: 'GET',
        url: '/public-auth-mode',
        authMode: 'passthrough',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<BusinessError>>({
        status: 401,
        message: 'public endpoint unauthorized',
      }),
    )

    expect(mock.history.post).toHaveLength(0)
    expect(recoverAuthSessionSpy).not.toHaveBeenCalled()
  })

  it('does not trigger refresh when authMode is no-refresh', async () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-old')
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-old')

    mock.onGet('/secure-no-refresh-mode').reply((config) => {
      expect(config.headers?.Authorization).toBe('access-old')
      return [
        401,
        {
          type: 'about:blank',
          title: 'unauthorized',
          status: 401,
          detail: 'protected endpoint unauthorized',
          code: ResponseCode.AUTH_ACCESS_TOKEN_INVALID,
          traceId: 'trace-no-refresh-mode',
        },
      ]
    })

    await expect(
      useRequest<{ ok: boolean }>({
        method: 'GET',
        url: '/secure-no-refresh-mode',
        authMode: 'no-refresh',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<BusinessError>>({
        status: 401,
        message: 'protected endpoint unauthorized',
      }),
    )

    expect(mock.history.post).toHaveLength(0)
    expect(recoverAuthSessionSpy).not.toHaveBeenCalled()
  })

  it('recovers auth session for direct 401 responses when no refresh token exists', async () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-old')

    mock.onGet('/secure-no-refresh').reply(401, {
      type: 'about:blank',
      title: 'unauthorized',
      status: 401,
      detail: 'access token invalid',
      code: ResponseCode.AUTH_ACCESS_TOKEN_INVALID,
      traceId: 'trace-auth-invalid',
    })

    await expect(
      useRequest<{ ok: boolean }>({
        method: 'GET',
        url: '/secure-no-refresh',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<BusinessError>>({
        status: 401,
        message: 'access token invalid',
      }),
    )

    expect(recoverAuthSessionSpy).toHaveBeenCalledTimes(1)
    expect(recoverAuthSessionSpy).toHaveBeenCalledWith(
      expect.objectContaining<Partial<BusinessError>>({
        status: 401,
        message: 'access token invalid',
      }),
    )
  })

  it('reports auth feedback for direct 403 response', async () => {
    mock.onGet('/forbidden').reply(403, {
      type: 'about:blank',
      title: 'forbidden',
      status: 403,
      detail: 'no permission',
      code: 40300,
      traceId: 'trace-forbidden',
    })

    await expect(
      useRequest<{ ok: boolean }>({
        method: 'GET',
        url: '/forbidden',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<BusinessError>>({
        status: 403,
        message: 'no permission',
      }),
    )

    expect(reportAuthErrorFeedbackSpy).toHaveBeenCalledTimes(1)
    expect(reportAuthErrorFeedbackSpy).toHaveBeenCalledWith(
      expect.objectContaining<Partial<BusinessError>>({
        status: 403,
        message: 'no permission',
      }),
    )
    expect(recoverAuthSessionSpy).not.toHaveBeenCalled()
  })
})
