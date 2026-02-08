import { hashKey, type QueryKey } from '@tanstack/query-core'
import { createRequestId } from '@/app/infrastructure/request/request-id'

const queryRequestIdPool = new Map<string, string>()

const toQueryHash = (queryKey: QueryKey): string => hashKey(queryKey)

export const getOrCreateQueryRequestId = (queryKey: QueryKey): string => {
  const queryHash = toQueryHash(queryKey)
  const cached = queryRequestIdPool.get(queryHash)
  if (cached) {
    return cached
  }

  const requestId = createRequestId()
  queryRequestIdPool.set(queryHash, requestId)
  return requestId
}

export const clearQueryRequestId = (queryKey: QueryKey): void => {
  queryRequestIdPool.delete(toQueryHash(queryKey))
}
