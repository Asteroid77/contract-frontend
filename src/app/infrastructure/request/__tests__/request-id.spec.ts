import { describe, expect, it } from 'vitest'
import type { AxiosResponse, RawAxiosResponseHeaders } from 'axios'
import {
  normalizeRequestId,
  readRequestIdFromBody,
  readRequestIdFromHeaders,
  resolveResponseRequestId,
} from '../request-id'

describe('request-id utils', () => {
  it('normalizeRequestId trims and filters invalid values', () => {
    expect(normalizeRequestId('  req-123  ')).toBe('req-123')
    expect(normalizeRequestId('   ')).toBeUndefined()
    expect(normalizeRequestId(undefined)).toBeUndefined()
    expect(normalizeRequestId(123)).toBeUndefined()
  })

  it('readRequestIdFromBody supports requestId and reuqestId', () => {
    expect(readRequestIdFromBody({ requestId: 'req-from-body' })).toBe('req-from-body')
    expect(readRequestIdFromBody({ reuqestId: 'legacy-typo-id' })).toBe('legacy-typo-id')
  })

  it('resolveResponseRequestId prefers body over headers', () => {
    const response = {
      data: {
        type: 'about:blank',
        title: 'ok',
        status: 200,
        detail: 'ok',
        code: 0,
        traceId: 'trace-1',
        requestId: 'req-from-body',
      },
      headers: {
        'x-request-id': 'req-from-header',
      } as RawAxiosResponseHeaders,
    } as AxiosResponse

    expect(resolveResponseRequestId(response)).toBe('req-from-body')
  })

  it('resolveResponseRequestId falls back to headers', () => {
    const response = {
      data: {
        type: 'about:blank',
        title: 'ok',
        status: 200,
        detail: 'ok',
        code: 0,
        traceId: 'trace-1',
      },
      headers: {
        'x-request-id': 'req-from-header',
      } as RawAxiosResponseHeaders,
    } as AxiosResponse

    expect(readRequestIdFromHeaders(response.headers)).toBe('req-from-header')
    expect(resolveResponseRequestId(response)).toBe('req-from-header')
  })
})
