import { QueryCache, QueryClient } from '@tanstack/query-core'
import { describe, expect, it } from 'vitest'
import { getCurrentRequestContext } from '@/app/infrastructure/request/request-context'
import { withQueryRequestContext } from '../query-request-context'
import { clearQueryRequestId, getOrCreateQueryRequestId } from '../query-request-id'

const createTestQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onSettled(_data, _error, query) {
        clearQueryRequestId(query.queryKey)
      },
    }),
  })

describe('query retry requestId', () => {
  it('reuses same requestId during retries and resets after success settled', async () => {
    const queryClient = createTestQueryClient()
    const queryKey = ['request-id', 'retry', 'success'] as const
    clearQueryRequestId(queryKey)

    const requestIds: string[] = []
    let attempt = 0

    const result = await queryClient.fetchQuery({
      queryKey,
      retry: 1,
      retryDelay: 0,
      queryFn: (ctx) =>
        withQueryRequestContext(ctx.queryKey, ctx, () => {
          const requestId = getCurrentRequestContext()?.requestId ?? ''
          requestIds.push(requestId)
          attempt += 1

          if (attempt === 1) {
            throw new Error('first attempt failed')
          }

          return requestId
        }),
    })

    expect(requestIds).toHaveLength(2)
    expect(requestIds[0]).toBeTruthy()
    expect(requestIds[0]).toBe(requestIds[1])
    expect(result).toBe(requestIds[1])

    const nextRoundRequestId = getOrCreateQueryRequestId(queryKey)
    expect(nextRoundRequestId).not.toBe(requestIds[0])

    queryClient.clear()
  })

  it('reuses same requestId during retries and resets after final failure settled', async () => {
    const queryClient = createTestQueryClient()
    const queryKey = ['request-id', 'retry', 'failed'] as const
    clearQueryRequestId(queryKey)

    const requestIds: string[] = []

    await expect(
      queryClient.fetchQuery({
        queryKey,
        retry: 1,
        retryDelay: 0,
        queryFn: (ctx) =>
          withQueryRequestContext(ctx.queryKey, ctx, () => {
            const requestId = getCurrentRequestContext()?.requestId ?? ''
            requestIds.push(requestId)
            throw new Error('always failed')
          }),
      }),
    ).rejects.toThrow('always failed')

    expect(requestIds).toHaveLength(2)
    expect(requestIds[0]).toBeTruthy()
    expect(requestIds[0]).toBe(requestIds[1])

    const nextRoundRequestId = getOrCreateQueryRequestId(queryKey)
    expect(nextRoundRequestId).not.toBe(requestIds[0])

    queryClient.clear()
  })
})
