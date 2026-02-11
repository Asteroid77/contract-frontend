import { describe, expect, it } from 'vitest'
import { BusinessError } from '@/modules/shared/domain/errors'
import { isErrorResponse } from '@/modules/shared/domain/response'

describe('shared domain errors/response', () => {
  it('BusinessError sets metadata fields and name correctly', () => {
    const error = new BusinessError(
      '业务失败',
      40001,
      'trace-123',
      'request-456',
      'https://example.com/problem/business',
      422,
    )

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('BusinessError')
    expect(error.message).toBe('业务失败')
    expect(error.code).toBe(40001)
    expect(error.traceId).toBe('trace-123')
    expect(error.requestId).toBe('request-456')
    expect(error.type).toBe('https://example.com/problem/business')
    expect(error.status).toBe(422)
    expect(error.isBusinessError).toBe(true)
  })

  it('BusinessError uses default optional values', () => {
    const error = new BusinessError('默认值测试', 50001)

    expect(error.traceId).toBe('')
    expect(error.requestId).toBe('')
    expect(error.type).toBe('about:blank')
    expect(error.status).toBe(400)
  })

  it('isErrorResponse returns true when status >= 400', () => {
    expect(
      isErrorResponse({
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'bad',
        code: 400,
        traceId: 'trace',
      }),
    ).toBe(true)

    expect(
      isErrorResponse({
        type: 'about:blank',
        title: 'Internal Error',
        status: 500,
        detail: 'oops',
        code: 500,
        traceId: 'trace',
      }),
    ).toBe(true)
  })

  it('isErrorResponse returns false for successful statuses', () => {
    expect(
      isErrorResponse({
        type: 'about:blank',
        title: 'OK',
        status: 200,
        detail: 'success',
        code: 0,
        traceId: 'trace',
        data: { id: 1 },
      }),
    ).toBe(false)

    expect(
      isErrorResponse({
        type: 'about:blank',
        title: 'Created',
        status: 201,
        detail: 'created',
        code: 0,
        traceId: 'trace',
      }),
    ).toBe(false)
  })
})
