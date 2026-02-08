import type { QueryFunctionContext, QueryKey } from '@tanstack/query-core'
import { withRequestContext } from '@/app/infrastructure/request/request-context'
import { getOrCreateQueryRequestId } from './query-request-id'

export async function withQueryRequestContext<T>(
  queryKey: QueryKey,
  queryFnContext: Pick<QueryFunctionContext<QueryKey>, 'signal'>,
  executor: () => Promise<T> | T,
): Promise<T> {
  const requestId = getOrCreateQueryRequestId(queryKey)
  return withRequestContext(
    {
      requestId,
      signal: queryFnContext.signal,
    },
    executor,
  )
}
