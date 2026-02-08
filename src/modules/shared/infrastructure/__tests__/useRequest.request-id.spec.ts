import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { AxiosRequestConfig, AxiosResponseHeaders, RawAxiosRequestHeaders } from 'axios'
import AxiosMockAdapter from 'axios-mock-adapter'
import { useRequest } from '../useRequest'
import { apiClient } from '@/app/infrastructure/request/http-client'
import { REQUEST_ID_HEADER } from '@/app/infrastructure/request/request-id'
import { BusinessError } from '@/modules/shared/domain/errors'

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

let mock: AxiosMockAdapter

describe('useRequest requestId behavior', () => {
  beforeEach(() => {
    mock = new AxiosMockAdapter(apiClient)
  })

  afterEach(() => {
    mock.restore()
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
})
