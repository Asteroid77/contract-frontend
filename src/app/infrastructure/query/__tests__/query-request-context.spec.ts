import { describe, expect, it, vi } from 'vitest'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import { withRequestContext } from '@/app/infrastructure/request/request-context'
import { getOrCreateQueryRequestId } from '@/app/infrastructure/query/query-request-id'

vi.mock('@/app/infrastructure/request/request-context', () => ({
  withRequestContext: vi.fn((_ctx, executor) => executor()),
}))

vi.mock('@/app/infrastructure/query/query-request-id', () => ({
  getOrCreateQueryRequestId: vi.fn(() => 'query-req-id-1'),
}))

describe('withQueryRequestContext', () => {
  it('creates requestId and delegates to withRequestContext with signal', async () => {
    const queryKey = ['approval', 'instance', 1]
    const signal = new AbortController().signal

    const result = await withQueryRequestContext(queryKey, { signal }, () => 'ok')

    expect(getOrCreateQueryRequestId).toHaveBeenCalledWith(queryKey)
    expect(withRequestContext).toHaveBeenCalledWith(
      {
        requestId: 'query-req-id-1',
        signal,
      },
      expect.any(Function),
    )
    expect(result).toBe('ok')
  })

  it('supports async executor result', async () => {
    const queryKey = ['user', 'page']
    const signal = new AbortController().signal

    const result = await withQueryRequestContext(queryKey, { signal }, async () => {
      return Promise.resolve(123)
    })

    expect(result).toBe(123)
  })
})
