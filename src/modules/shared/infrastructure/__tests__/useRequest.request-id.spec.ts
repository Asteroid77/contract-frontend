import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AxiosRequestConfig, AxiosResponseHeaders, RawAxiosRequestHeaders } from 'axios'
import AxiosMockAdapter from 'axios-mock-adapter'
import { useRequest } from '../useRequest'
import { apiClient } from '@/app/infrastructure/request/http-client'
import { REQUEST_ID_HEADER } from '@/app/infrastructure/request/request-id'
import { BusinessError } from '@/modules/shared/domain/errors'
import { STORAGE_KEYS } from '@/constants/storage'
import { AUTH_ENDPOINTS } from '@/modules/access/infrastructure/auth-endpoints'

const readHeader = (
  headers?: AxiosResponseHeaders | RawAxiosRequestHeaders,
  key?: string,
): string | undefined => {
  if (!headers || !key) {
    return undefined
  }

  if (typeof (headers as { get?: (name: string) => string | undefined }).get === 'function') {
    const headerValue = (headers as { get: (name: string) => string | undefined }).get(key)
    if (headerValue) {
      return headerValue
    }
  }

  const record = headers as Record<string, unknown>
  const value = record[key] ?? record[key.toLowerCase()]
  return typeof value === 'string' ? value : undefined
}

const parseJsonBody = (data: unknown): Record<string, unknown> => {
  if (typeof data === 'string' && data.length > 0) {
    return JSON.parse(data) as Record<string, unknown>
  }

  if (data && typeof data === 'object') {
    return data as Record<string, unknown>
  }

  return {}
}

let mock: AxiosMockAdapter

describe('useRequest requestId behavior', () => {
  beforeEach(() => {
    mock = new AxiosMockAdapter(apiClient)
    localStorage.clear()
  })

  afterEach(() => {
    mock.restore()
    localStorage.clear()
  })

  it('injects requestId header from requestContext', async () => {
    let capturedRequestHeaders: AxiosResponseHeaders | RawAxiosRequestHeaders | undefined

    mock.onGet('/mock').reply((config) => {
      capturedRequestHeaders = config.headers as AxiosResponseHeaders | RawAxiosRequestHeaders
      return [
        200,
        {
          type: 'about:blank',
          title: 'ok',
          status: 200,
          detail: 'ok',
          code: 0,
          traceId: 'trace-id-1',
          data: { name: 'alice' },
        },
      ]
    })

    await useRequest<{ name: string }>({
      method: 'GET',
      url: '/mock',
      requestContext: {
        requestId: 'request-id-from-context',
      },
    })

    expect(readHeader(capturedRequestHeaders, REQUEST_ID_HEADER)).toBe('request-id-from-context')
  })

  it('prefers response body requestId over response header requestId', async () => {
    mock.onGet('/mock').reply(
      200,
      {
        type: 'about:blank',
        title: 'ok',
        status: 200,
        detail: 'ok',
        code: 0,
        traceId: 'trace-id-2',
        requestId: 'request-id-from-body',
        data: { value: 1 },
      },
      {
        'x-request-id': 'request-id-from-header',
      },
    )

    const result = await useRequest<{ value: number }>({
      method: 'GET',
      url: '/mock',
      responseShape: 'envelope',
    })

    expect(result.requestId).toBe('request-id-from-body')
  })

  it('falls back to response header requestId when body requestId missing', async () => {
    mock.onGet('/mock').reply(
      200,
      {
        type: 'about:blank',
        title: 'ok',
        status: 200,
        detail: 'ok',
        code: 0,
        traceId: 'trace-id-3',
        data: { value: 2 },
      },
      {
        'x-request-id': 'request-id-from-header',
      },
    )

    const result = await useRequest<{ value: number }>({
      method: 'GET',
      url: '/mock',
      responseShape: 'envelope',
    })

    expect(result.requestId).toBe('request-id-from-header')
  })

  it('maps failed response requestId to BusinessError', async () => {
    mock.onGet('/mock').reply(
      500,
      {
        type: 'about:blank',
        title: 'failed',
        status: 500,
        detail: 'failed',
        code: 5000,
        traceId: 'trace-id-4',
      },
      {
        'x-request-id': 'request-id-from-header',
      },
    )

    await expect(
      useRequest<{ value: number }>({
        method: 'GET',
        url: '/mock',
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<BusinessError>>({ requestId: 'request-id-from-header' }),
    )
  })

  it('retries with refreshed token on 401 and keeps same requestId', async () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-old')
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-old')

    let protectedAttempt = 0
    let refreshCallCount = 0

    const protectedRequestIds: string[] = []
    const protectedAuthHeaders: string[] = []

    mock.onGet('/protected').reply((config: AxiosRequestConfig) => {
      protectedAttempt += 1
      protectedRequestIds.push(
        readHeader(config.headers as RawAxiosRequestHeaders, REQUEST_ID_HEADER) ?? '',
      )
      protectedAuthHeaders.push(
        readHeader(config.headers as RawAxiosRequestHeaders, 'Authorization') ?? '',
      )

      if (protectedAttempt === 1) {
        return [
          401,
          {
            type: 'about:blank',
            title: 'expired',
            status: 401,
            detail: 'token expired',
            code: 401,
            traceId: 'trace-id-401',
          },
        ]
      }

      return [
        200,
        {
          type: 'about:blank',
          title: 'ok',
          status: 200,
          detail: 'ok',
          code: 0,
          traceId: 'trace-id-ok',
          data: { ok: true },
        },
      ]
    })

    mock.onPost(AUTH_ENDPOINTS.TOKEN_REFRESH).reply((config: AxiosRequestConfig) => {
      refreshCallCount += 1
      const payload = parseJsonBody(config.data)
      expect(payload.refreshToken).toBe('refresh-old')

      return [
        200,
        {
          type: 'about:blank',
          title: 'ok',
          status: 200,
          detail: 'ok',
          code: 0,
          traceId: 'trace-id-refresh',
          data: {
            accessToken: 'access-new',
            refreshToken: 'refresh-new',
            tokenType: 'Bearer',
            expiresIn: 7200,
          },
        },
      ]
    })

    const response = await useRequest<{ ok: boolean }>({
      method: 'GET',
      url: '/protected',
      requestContext: {
        requestId: 'request-id-stable',
      },
      responseShape: 'envelope',
    })

    expect(response.data.ok).toBe(true)
    expect(refreshCallCount).toBe(1)
    expect(protectedAttempt).toBe(2)
    expect(protectedAuthHeaders).toEqual(['access-old', 'access-new'])
    expect(protectedRequestIds).toEqual(['request-id-stable', 'request-id-stable'])
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('access-new')
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-new')
  })

  it('replays with latest token when first attempt used stale token and skips refresh', async () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-old')
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-stable')

    let protectedAttempt = 0
    let refreshCallCount = 0
    const protectedAuthHeaders: string[] = []

    mock.onGet('/protected-stale').reply((config: AxiosRequestConfig) => {
      protectedAttempt += 1
      protectedAuthHeaders.push(
        readHeader(config.headers as RawAxiosRequestHeaders, 'Authorization') ?? '',
      )

      if (protectedAttempt === 1) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-new')
        return [
          401,
          {
            type: 'about:blank',
            title: 'expired',
            status: 401,
            detail: 'token expired',
            code: 401,
            traceId: 'trace-id-stale-401',
          },
        ]
      }

      return [
        200,
        {
          type: 'about:blank',
          title: 'ok',
          status: 200,
          detail: 'ok',
          code: 0,
          traceId: 'trace-id-stale-ok',
          data: { ok: true },
        },
      ]
    })

    mock.onPost(AUTH_ENDPOINTS.TOKEN_REFRESH).reply(() => {
      refreshCallCount += 1
      return [
        500,
        {
          type: 'about:blank',
          title: 'unexpected',
          status: 500,
          detail: 'refresh should not be called',
          code: 5000,
          traceId: 'trace-id-refresh-unexpected',
        },
      ]
    })

    const response = await useRequest<{ ok: boolean }>({
      method: 'GET',
      url: '/protected-stale',
      requestContext: {
        requestId: 'request-id-stale',
      },
      responseShape: 'envelope',
    })

    expect(response.data.ok).toBe(true)
    expect(protectedAttempt).toBe(2)
    expect(refreshCallCount).toBe(0)
    expect(protectedAuthHeaders).toEqual(['access-old', 'access-new'])
  })
})
