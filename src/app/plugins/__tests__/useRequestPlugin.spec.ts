import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QueryClient,
  type QueryKey,
  type QueryObserverOptions,
  type MutationObserverOptions,
  VueQueryPlugin,
} from '@tanstack/vue-query'
import { BusinessError } from '@/modules/shared/domain/errors'
import { enableQueryPersistence, useRequestPlugin } from '@/app/plugins/useRequestPlugin'
import { notification, showUniqueErrorNotification } from '@/_utils/discrete_naive_api'
import { clearQueryRequestId } from '@/app/infrastructure/query/query-request-id'

const { axiosIsAxiosErrorSpy, persistQueryClientMock } = vi.hoisted(() => ({
  axiosIsAxiosErrorSpy: vi.fn(),
  persistQueryClientMock: vi.fn(() => [vi.fn(), Promise.resolve()]),
}))

vi.mock('axios', () => ({
  default: {
    isAxiosError: axiosIsAxiosErrorSpy,
  },
  isAxiosError: axiosIsAxiosErrorSpy,
}))

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
}))

vi.mock('@/_utils/discrete_naive_api', () => ({
  notification: {
    success: vi.fn(),
  },
  showUniqueErrorNotification: vi.fn(),
}))

vi.mock('@/app/infrastructure/query/tanstack_query_persist_with_dexie', () => ({
  queryPersister: {
    persisterFn: vi.fn(),
  },
  queryClientPersister: {
    persistClient: vi.fn(),
    restoreClient: vi.fn(),
    removeClient: vi.fn(),
  },
}))

vi.mock('@tanstack/query-persist-client-core', () => ({
  persistQueryClient: persistQueryClientMock,
}))

vi.mock('@/app/infrastructure/query/query-request-id', () => ({
  clearQueryRequestId: vi.fn(),
}))

vi.mock('@/app/infrastructure/request/request-id', () => ({
  readRequestIdFromBody: vi.fn(() => 'req-from-body'),
  readRequestIdFromHeaders: vi.fn(() => 'req-from-header'),
}))

type QueryMetaStub = QueryObserverOptions['meta']
type MutationMetaStub = MutationObserverOptions['meta']

type QueryStub = {
  meta?: QueryMetaStub
  queryKey: QueryKey
  state: {
    status: string
    fetchStatus: string
    fetchFailureCount: number
    data: unknown
    dataUpdatedAt: number
  }
  options: Record<string, unknown>
  getObserversCount: () => number
}

type MutationStub = {
  meta?: MutationMetaStub
  mutationId: number
}

type QueryCacheConfigLike = {
  onError: (error: Error, query: QueryStub) => void
  onSuccess: (data: { detail: string }, query: QueryStub) => void
  onSettled: (data: unknown, error: unknown, query: { queryKey: QueryKey }) => void
}

type MutationCacheConfigLike = {
  onSuccess: (
    data: { detail: string },
    variables: unknown,
    context: unknown,
    mutation: MutationStub,
  ) => void
}

const getQueryCacheConfig = (queryClient: QueryClient): QueryCacheConfigLike =>
  (queryClient.getQueryCache() as unknown as { config: QueryCacheConfigLike }).config

const getMutationCacheConfig = (queryClient: QueryClient): MutationCacheConfigLike =>
  (queryClient.getMutationCache() as unknown as { config: MutationCacheConfigLike }).config

const getQueryRetryOption = (queryClient: QueryClient) =>
  queryClient.getDefaultOptions().queries?.retry as
    | ((failureCount: number, error: unknown) => boolean)
    | undefined

const createQueryStub = (meta?: QueryMetaStub, data: unknown = undefined): QueryStub => ({
  meta,
  queryKey: ['approval', 'instance', 1],
  state: {
    status: 'error',
    fetchStatus: 'idle',
    fetchFailureCount: 1,
    data,
    dataUpdatedAt: 0,
  },
  options: {},
  getObserversCount: () => 0,
})

const createMutationStub = (meta?: MutationMetaStub): MutationStub => ({
  meta,
  mutationId: 123,
})

describe('useRequestPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axiosIsAxiosErrorSpy.mockReturnValue(false)
  })

  it('returns VueQueryPlugin with QueryClient option', () => {
    const plugins = useRequestPlugin()

    expect(plugins).toHaveLength(1)
    expect(plugins[0].plugin).toBe(VueQueryPlugin)
    expect(plugins[0].option).toEqual(
      expect.objectContaining({
        queryClient: expect.any(QueryClient),
      }),
    )
  })

  it('enables persistence lazily and only once', async () => {
    await enableQueryPersistence()
    await enableQueryPersistence()

    expect(persistQueryClientMock).toHaveBeenCalledTimes(1)
    expect(persistQueryClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryClient: expect.any(QueryClient),
      }),
    )
  })

  it('queryCache onSettled clears query request id', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const queryCacheConfig = getQueryCacheConfig(queryClient)

    queryCacheConfig.onSettled(undefined, null, {
      queryKey: ['q', '1'],
    })

    expect(clearQueryRequestId).toHaveBeenCalledWith(['q', '1'])
  })

  it('queryCache onError handles BusinessError and reports unique notification', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const queryCacheConfig = getQueryCacheConfig(queryClient)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const error = new BusinessError('biz-fail', 40001, 'trace-1', 'request-1')
    queryCacheConfig.onError(error, createQueryStub(undefined, { stale: true }))

    expect(showUniqueErrorNotification).toHaveBeenCalledTimes(1)
    expect(showUniqueErrorNotification).toHaveBeenCalledWith(
      'query:["approval","instance",1]:40001:request-1:biz-fail',
      expect.objectContaining({
        title: 't:common.error.businessFail',
      }),
    )

    consoleErrorSpy.mockRestore()
  })

  it('queryCache onError handles axios-like response error and includes request id', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const queryCacheConfig = getQueryCacheConfig(queryClient)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    axiosIsAxiosErrorSpy.mockReturnValue(true)

    const axiosError = Object.assign(new Error('axios-error'), {
      response: {
        data: {
          detail: 'detail-from-server',
          traceId: 'trace-server',
        },
        headers: {
          'x-request-id': 'req-header',
        },
      },
    })

    queryCacheConfig.onError(axiosError, createQueryStub(undefined, { stale: true }))

    expect(showUniqueErrorNotification).toHaveBeenCalledWith(
      'query:["approval","instance",1]:na:na:axios-error',
      expect.objectContaining({
        title: 't:common.error.timeout',
      }),
    )

    consoleErrorSpy.mockRestore()
  })

  it('queryCache onError ignores canceled error notifications', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const queryCacheConfig = getQueryCacheConfig(queryClient)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const canceled = new Error('canceled')
    canceled.name = 'CanceledError'

    queryCacheConfig.onError(canceled, createQueryStub())

    expect(showUniqueErrorNotification).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('queryCache onError no longer handles 403 with default toast', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const queryCacheConfig = getQueryCacheConfig(queryClient)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const error = new BusinessError('forbidden', 40300, 'trace-403', 'request-403', 'about:blank', 403)
    queryCacheConfig.onError(error, createQueryStub())

    expect(showUniqueErrorNotification).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('queryCache onError skips default toast when query has no cached data', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const queryCacheConfig = getQueryCacheConfig(queryClient)

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const error = new BusinessError('initial-load-failed', 50000, 'trace-2', 'request-2')
    queryCacheConfig.onError(error, createQueryStub())

    expect(showUniqueErrorNotification).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })

  it('queryCache onError can be bypassed with skipGlobalErrorHandler meta', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const queryCacheConfig = getQueryCacheConfig(queryClient)

    const error = new BusinessError('skip-global', 50001, 'trace-3', 'request-3')
    queryCacheConfig.onError(
      error,
      createQueryStub(
        {
          skipGlobalErrorHandler: true,
        },
        { stale: true },
      ),
    )

    expect(showUniqueErrorNotification).not.toHaveBeenCalled()
  })

  it('mutationCache onSuccess does not show notification by default', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const mutationCacheConfig = getMutationCacheConfig(queryClient)

    mutationCacheConfig.onSuccess(
      {
        detail: 'mutation-ok',
      },
      null,
      null,
      createMutationStub(),
    )

    expect(notification.success).not.toHaveBeenCalled()
  })

  it('queryCache onSuccess can show notification when toastOnSuccess enabled', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const queryCacheConfig = getQueryCacheConfig(queryClient)

    queryCacheConfig.onSuccess(
      {
        detail: 'query-success',
      },
      createQueryStub({
        toastOnSuccess: true,
      }),
    )

    expect(notification.success).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 't:common.status.success',
        content: 'query-success',
      }),
    )
  })

  it('mutationCache onSuccess can show notification when toastOnSuccess enabled', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const mutationCacheConfig = getMutationCacheConfig(queryClient)

    mutationCacheConfig.onSuccess(
      {
        detail: 'mutation-ok',
      },
      null,
      null,
      createMutationStub({
        toastOnSuccess: true,
      }),
    )

    expect(notification.success).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 't:common.status.success',
        content: 'mutation-ok',
      }),
    )
  })

  it('query retry does not retry non-retryable 4xx business errors', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const retry = getQueryRetryOption(queryClient)
    const badRequestError = new BusinessError('bad request', 40000, '', '', 'about:blank', 400)

    expect(retry).toBeTypeOf('function')
    expect(retry?.(0, badRequestError)).toBe(false)
  })

  it('query retry retries on 5xx errors with max retry count', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const retry = getQueryRetryOption(queryClient)
    const serverError = new BusinessError('server error', 50000, '', '', 'about:blank', 500)

    expect(retry).toBeTypeOf('function')
    expect(retry?.(0, serverError)).toBe(true)
    expect(retry?.(1, serverError)).toBe(true)
    expect(retry?.(2, serverError)).toBe(false)
  })

  it('query retry retries transient network errors', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const retry = getQueryRetryOption(queryClient)
    const networkError = {
      request: {},
      response: undefined,
      code: 'ERR_NETWORK',
    }

    axiosIsAxiosErrorSpy.mockReturnValue(true)

    expect(retry).toBeTypeOf('function')
    expect(retry?.(0, networkError)).toBe(true)
  })
})
