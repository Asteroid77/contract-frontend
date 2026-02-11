import { describe, expect, it } from 'vitest'
import type { AxiosResponse, RawAxiosResponseHeaders } from 'axios'
import {
  createRequestId,
  normalizeRequestId,
  readRequestIdFromBody,
  readRequestIdFromHeaders,
  resolveResponseRequestId,
} from '../request-id'

describe('request-id utils', () => {
  it('createRequestId returns non-empty string id', () => {
    const requestId = createRequestId()

    expect(typeof requestId).toBe('string')
    expect(requestId.length).toBeGreaterThan(0)
  })

  it('normalizeRequestId trims and filters invalid values', () => {
    expect(normalizeRequestId('  req-123  ')).toBe('req-123')
    expect(normalizeRequestId('   ')).toBeUndefined()
    expect(normalizeRequestId(undefined)).toBeUndefined()
    expect(normalizeRequestId(123)).toBeUndefined()
  })

  it('readRequestIdFromHeaders prefers canonical header key then lowercase fallback', () => {
    expect(
      readRequestIdFromHeaders({
        'X-Request-Id': ' canonical-id ',
        'x-request-id': 'lower-id',
      } as RawAxiosResponseHeaders),
    ).toBe('canonical-id')

    expect(
      readRequestIdFromHeaders({
        'x-request-id': ' lower-id ',
      } as RawAxiosResponseHeaders),
    ).toBe('lower-id')
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
