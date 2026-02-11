import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { BusinessError } from '@/modules/shared/domain/errors'
import { useRequestPlugin } from '@/app/plugins/useRequestPlugin'
import { notification, showUniqueErrorNotification } from '@/_utils/discrete_naive_api'
import { clearQueryRequestId } from '@/app/infrastructure/query/query-request-id'
import { queryPersister } from '@/app/infrastructure/query/tanstack_query_persist_with_dexie'

const { axiosIsAxiosErrorSpy } = vi.hoisted(() => ({
  axiosIsAxiosErrorSpy: vi.fn(),
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
}))

vi.mock('@/app/infrastructure/query/query-request-id', () => ({
  clearQueryRequestId: vi.fn(),
}))

vi.mock('@/app/infrastructure/request/request-id', () => ({
  readRequestIdFromBody: vi.fn(() => 'req-from-body'),
  readRequestIdFromHeaders: vi.fn(() => 'req-from-header'),
}))

const createQueryStub = (meta?: Record<string, unknown>) =>
  ({
    meta,
    queryKey: ['approval', 'instance', 1],
    state: {
      status: 'error',
      fetchStatus: 'idle',
      fetchFailureCount: 1,
      data: undefined,
      dataUpdatedAt: 0,
    },
    options: {},
    getObserversCount: () => 0,
  }) as any

const createMutationStub = (meta?: Record<string, unknown>) =>
  ({
    meta,
    mutationId: 123,
  }) as any

describe('useRequestPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    axiosIsAxiosErrorSpy.mockReturnValue(false)
  })

  it('returns VueQueryPlugin with QueryClient and persister option', () => {
    const plugins = useRequestPlugin()

    expect(plugins).toHaveLength(1)
    expect(plugins[0].plugin).toBe(VueQueryPlugin)
    expect(plugins[0].option).toEqual(
      expect.objectContaining({
        queryClient: expect.any(QueryClient),
        persistOptions: {
          persister: queryPersister.persisterFn,
        },
      }),
    )
  })

  it('queryCache onSettled clears query request id', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const queryCacheConfig = (queryClient.getQueryCache() as any).config

    queryCacheConfig.onSettled(undefined, null, {
      queryKey: ['q', '1'],
    })

    expect(clearQueryRequestId).toHaveBeenCalledWith(['q', '1'])
  })

  it('queryCache onError handles BusinessError and reports unique notification', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const queryCacheConfig = (queryClient.getQueryCache() as any).config

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const error = new BusinessError('biz-fail', 40001, 'trace-1', 'request-1')
    queryCacheConfig.onError(error, createQueryStub())

    expect(showUniqueErrorNotification).toHaveBeenCalledTimes(1)
    expect(showUniqueErrorNotification).toHaveBeenCalledWith(
      'biz-fail',
      expect.objectContaining({
        title: 't:common.error.businessFail',
      }),
    )

    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  it('queryCache onError handles axios-like response error and includes request id', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const queryCacheConfig = (queryClient.getQueryCache() as any).config

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

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

    queryCacheConfig.onError(axiosError, createQueryStub())

    expect(showUniqueErrorNotification).toHaveBeenCalledWith(
      'axios-error',
      expect.objectContaining({
        title: 't:common.error.timeout',
      }),
    )

    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  it('queryCache onError ignores canceled error notifications', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const queryCacheConfig = (queryClient.getQueryCache() as any).config

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const canceled = new Error('canceled')
    canceled.name = 'CanceledError'

    queryCacheConfig.onError(canceled, createQueryStub())

    expect(showUniqueErrorNotification).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  it('mutationCache onSuccess shows default success notification', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const mutationCacheConfig = (queryClient.getMutationCache() as any).config

    mutationCacheConfig.onSuccess(
      {
        detail: 'mutation-ok',
      },
      null,
      null,
      createMutationStub(),
    )

    expect(notification.success).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 't:common.status.success',
        content: 'mutation-ok',
      }),
    )
  })

  it('queryCache onSuccess can show notification when toastOnSuccess enabled', () => {
    const queryClient = useRequestPlugin()[0].option?.queryClient as QueryClient
    const queryCacheConfig = (queryClient.getQueryCache() as any).config

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
})
