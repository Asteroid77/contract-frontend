import {
  Mutation,
  MutationCache,
  Query,
  QueryCache,
  QueryClient,
  VueQueryPlugin,
} from '@tanstack/vue-query'
import type { ToBeInstalledPlugin } from '.'
import { notification, showUniqueErrorNotification } from '@/_utils/discrete_naive_api'
import { $t } from '@/_utils/i18n'
import { match } from 'ts-pattern'
import type { NotificationOptions } from 'naive-ui'
import type { ServerResponse } from '@/types/request'
import type { AxiosError, AxiosResponse } from 'axios'
import axios from 'axios'
import { queryPersister } from '@/_utils/tanstack_query_persist_with_dexie'
/**
 * 错误信息接口
 */
interface ProcessedError {
  title: string
  content: string
  originalError: unknown
}
/**
 * 解析 API 错误，提取出提示信息
 * @param error - 捕获到的未知错误
 * @returns 错误信息对象
 */
function processApiError(error: Error | undefined): ProcessedError | undefined {
  const originalError = error

  // 1. 处理主动抛出的、带有 isBusinessError 标志的业务错误
  if (error?.hasOwnProperty('isBusinessError')) {
    return {
      title: $t('exception.unexpected.business.title'), // "业务异常"
      content: error.message,
      originalError,
    }
  }

  // 2. 接着处理 Axios 错误
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ServerResponse<unknown>>

    // 2a. 服务器有响应，但状态码是 4xx/5xx
    if (axiosError.response) {
      // 尝试从响应体中获取后端定义的错误信息
      const serverMessage = axiosError.response.data?.message
      return {
        title: $t('exception.ECONNABORTED.content'), // "请求失败"
        content: serverMessage || $t('exception.ECONNABORTED.meta'),
        originalError,
      }
    }

    // 2b. 服务器无响应（网络错误、超时等）
    if (axiosError.request) {
      return {
        title: $t('exception.ERR_USER_NETWORK_NOTWORK.content'),
        content: $t('exception.ERR_USER_NETWORK_NOTWORK.meta'),
        originalError,
      }
    }
  }

  // 3. 处理其他标准 JavaScript Error
  if (error instanceof Error) {
    // 排除被取消的请求，它们不应该被视为错误
    if (error.name === 'CanceledError') {
      return undefined
      //  return { title: $t('exception.CANCELEDERROR.title'), content: $t('exception.CANCELEDERROR.content'), originalError }
    }
    return {
      title: $t('exception.unexpected.title'),
      content: error.message || $t('exception.unexpected.message'),
      originalError,
    }
  }

  // 4. 降级处理：错误不是一个 Error 对象
  return {
    title: $t('exception.unexpected.unknown.title'), // "未知错误"
    content: $t('exception.unexpected.unknown.content'), // "发生了一个未知错误"
    originalError,
  }
}
const globalBaseErrorHandler = (
  error: unknown,
  query?: Query<unknown, unknown, unknown>,
  variables?: unknown,
  context?: unknown,
  mutation?: Mutation<unknown, unknown, unknown, unknown>,
) => {
  const gatherStruction = query ? query : (mutation as Mutation<unknown, unknown, unknown, unknown>)
  const isDefaultToastOnError = true
  const isExecute =
    gatherStruction.meta?.toastOnError === undefined
      ? isDefaultToastOnError
      : !!gatherStruction.meta?.toastOnError
  if (isExecute) {
    if (error instanceof Error) {
      console.error('A global request error was caught:', error)
      const errorKey = error.message || 'unknown-error'
      const toastOnErrorConfig = gatherStruction.meta?.toastOnError ?? true
      match(typeof toastOnErrorConfig)
        .with('function', () => {
          const throwOnError = gatherStruction.meta?.toastOnError as (
            error: Error,
            query: Query<unknown, unknown, unknown> | Mutation<unknown, unknown, unknown, unknown>,
          ) => NotificationOptions
          showUniqueErrorNotification(errorKey, throwOnError(error, gatherStruction))
        })
        .with('object', () => {
          const throwOnError = gatherStruction.meta?.toastOnError as NotificationOptions
          showUniqueErrorNotification(errorKey, throwOnError)
        })
        .otherwise(() => {
          const result = processApiError(error)
          if (result) {
            showUniqueErrorNotification(errorKey, {
              title: result.title,
              content: result.content,
              duration: 5000,
              keepAliveOnHover: true,
            })
          }
        })
    } else {
      const result = processApiError(error as undefined)
      if (result) {
        const errorKey = 'unknown-error'
        showUniqueErrorNotification(errorKey, {
          title: result.title,
          content: result.content,
          duration: 5000,
          keepAliveOnHover: true,
        })
      }
    }
  }

  let logContext: Record<string, unknown> = {
    variables,
    context,
  }
  if (query) {
    const ctx = gatherStruction as Query
    logContext = {
      ...logContext,
      queryKey: ctx.queryKey,
      // 状态快照
      state: {
        status: ctx.state.status,
        queryFetchStatus: ctx.state.fetchStatus,
        queryFetchFailureCount: ctx.state.fetchFailureCount,
        // 服务端返回的数据
        data: gatherStruction.state.data,
        // 数据有多旧？
        queryDataUpdatedAt:
          ctx.state.dataUpdatedAt > 0 ? new Date(ctx.state.dataUpdatedAt).toISOString() : null,
        // 緩存中是否有旧数据？
        queryHasStaleData: ctx.state.data !== undefined,
      },
      // query配置信息
      queryOptions: {
        retry: ctx.options?.retry,
        gcTime: ctx.options?.gcTime,
      },
      // 影响范围
      queryActiveObservers: ctx.getObserversCount(),
    }
  } else {
    const ctx = gatherStruction as Mutation
    logContext = {
      ...logContext,
      // 请求key
      mutationKey: ctx.mutationId,
    }
  }
  console.log('logContext', logContext)
}
const globalMutationErrorHandler = (
  error: unknown,
  context: unknown,
  variables: unknown,
  mutation: Mutation<unknown, unknown, unknown, unknown>,
) => {
  globalBaseErrorHandler(error, undefined, variables, context, mutation)
}
const globalSuccessHandler = (
  data: ServerResponse<unknown> | AxiosResponse<ServerResponse<unknown>>,
  variabbles: unknown,
  context: unknown,
  query?: Query<unknown, unknown, unknown>,
  mutation?: Mutation<unknown, unknown, unknown, unknown>,
) => {
  const gatherStruction = query ? query : (mutation as Mutation<unknown, unknown, unknown, unknown>)
  const isDefaultToastOnSuccess = query ? false : true
  const isExecute = isDefaultToastOnSuccess || !!gatherStruction.meta?.toastOnSuccess
  const toastOnErrorConfig = gatherStruction.meta?.toastOnSuccess ?? true
  if (isExecute) {
    match(typeof toastOnErrorConfig)
      .with('function', () => {
        const toastOnSuccess = gatherStruction.meta?.toastOnSuccess as (
          data: ServerResponse<unknown> | AxiosResponse<ServerResponse<unknown>>,
          query: Query<unknown, unknown, unknown> | Mutation<unknown, unknown, unknown, unknown>,
        ) => NotificationOptions
        notification.success(toastOnSuccess(data, gatherStruction))
      })
      .with('object', () => {
        const toastOnSuccess = gatherStruction.meta?.toastOnSuccess as NotificationOptions
        notification.success(toastOnSuccess)
      })
      .otherwise(() => {
        if (toastOnErrorConfig) {
          notification.success({
            title: $t('common.success'),
            content: data.hasOwnProperty('config')
              ? (data as AxiosResponse<ServerResponse<unknown>>).data.message
              : (data as ServerResponse<unknown>).message,
            duration: 5000,
            keepAliveOnHover: true,
          })
        }
      })
  }
}
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      select: (response: unknown) => {
        // return unwrapped data
        if (response && typeof response === 'object' && 'data' in response) {
          return (response as ServerResponse<unknown>).data
        }
        // return original data.
        return response
      },
    },
  },
  // --- Query 的全局错误处理 (通过订阅缓存事件) ---
  // ... (之前的 queryCache.subscribe 逻辑) ...

  // --- Mutation 的全局成功/失败提示 ---
  queryCache: new QueryCache({
    onError: globalBaseErrorHandler,
    onSuccess(data, query) {
      const result = data as ServerResponse<unknown> | AxiosResponse<ServerResponse<unknown>>
      globalSuccessHandler(result, null, null, query, undefined)
    },
  }),
  mutationCache: new MutationCache({
    onError: globalMutationErrorHandler,
    onSuccess(data, variables, context, mutation) {
      const result = data as ServerResponse<unknown> | AxiosResponse<ServerResponse<unknown>>
      globalSuccessHandler(result, null, null, undefined, mutation)
    },
  }),
})

/**
 * 初始化TanStack Query
 */
export function useRequestPlugin(): ToBeInstalledPlugin[] {
  return [
    {
      plugin: VueQueryPlugin,
      option: {
        queryClient,
        persistOptions: {
          persister: queryPersister.persisterFn,
        },
      },
    },
  ]
}
