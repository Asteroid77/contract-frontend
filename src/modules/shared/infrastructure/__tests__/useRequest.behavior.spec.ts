import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { apiClient } from '@/app/infrastructure/request/http-client'
import { BusinessError } from '@/modules/shared/domain/errors'

let mock: AxiosMockAdapter

describe('useRequest behavior branches', () => {
  beforeEach(() => {
    mock = new AxiosMockAdapter(apiClient)
    localStorage.clear()
  })

  afterEach(() => {
    mock.restore()
    localStorage.clear()
  })

  it('returns axios response when unWrap is false and injects response requestId', async () => {
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
      unWrap: false,
    })

    expect(result.data.data.ok).toBe(true)
    expect(result.data.requestId).toBe('request-id-from-header')
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
    })

    expect(result.requestId).toBe('request-id-lowercase')
    expect(result.data.value).toBe(1)
  })
})
