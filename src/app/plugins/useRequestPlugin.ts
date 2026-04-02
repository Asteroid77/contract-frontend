import { MutationCache, QueryCache, QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { Mutation, Query, QueryKey } from '@tanstack/vue-query'
import type { ToBeInstalledPlugin } from '.'
import { notification, showUniqueErrorNotification } from '@/_utils/discrete_naive_api'
import { $t } from '@/_utils/i18n'
import { match } from 'ts-pattern'
import type { RFC7807Response } from '@/modules/shared/domain/response'
import { BusinessError } from '@/modules/shared/domain/errors'
import type { AxiosError, AxiosResponse } from 'axios'
import axios from 'axios'
import type { NotificationOptions as NaiveNotificationOptions } from 'naive-ui'
import { clearQueryRequestId } from '@/app/infrastructure/query/query-request-id'
import {
  readRequestIdFromBody,
  readRequestIdFromHeaders,
} from '@/app/infrastructure/request/request-id'
/**
 * 错误信息接口
 */
interface ProcessedError {
  title: string
  content: string
  originalError: unknown
}

type SuccessPayload = RFC7807Response<unknown> | AxiosResponse<RFC7807Response<unknown>>

type AppQuery = Query<unknown, unknown, unknown, QueryKey>
type AppMutation = Mutation<unknown, unknown, unknown, unknown>
type RequestTarget = AppQuery | AppMutation

type QueryErrorToastHandler = (error: Error, query: AppQuery) => NaiveNotificationOptions
type MutationErrorToastHandler = (error: Error, mutation: AppMutation) => NaiveNotificationOptions
type QuerySuccessToastHandler = (data: unknown, query: AppQuery) => NaiveNotificationOptions
type MutationSuccessToastHandler = (data: unknown, mutation: AppMutation) => NaiveNotificationOptions

const MAX_QUERY_RETRY_COUNT = 2
const RETRYABLE_CLIENT_STATUS_CODES = new Set([408, 429])

function isRetryableHttpStatus(status: number): boolean {
  return status >= 500 || RETRYABLE_CLIENT_STATUS_CODES.has(status)
}

function resolveErrorStatus(error: unknown): number | undefined {
  if (error instanceof BusinessError) {
    return error.status
  }

  if (axios.isAxiosError(error)) {
    const problemDetails = error.response?.data as RFC7807Response<unknown> | undefined
    return error.response?.status ?? problemDetails?.status
  }

  return undefined
}

function isRetryableNetworkError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false
  }

  // No response means transient network failures (dns/offline/connection reset).
  if (error.request && !error.response) {
    return true
  }

  return error.code === 'ECONNABORTED'
}

function shouldRetryQueryError(failureCount: number, error: unknown): boolean {
  if (error instanceof Error && error.name === 'CanceledError') {
    return false
  }

  const status = resolveErrorStatus(error)
  const retryableError =
    typeof status === 'number' ? isRetryableHttpStatus(status) : isRetryableNetworkError(error)

  return retryableError && failureCount < MAX_QUERY_RETRY_COUNT
}

function shouldSkipGlobalErrorHandler(target: RequestTarget): boolean {
  return target.meta?.skipGlobalErrorHandler === true
}

function shouldShowDefaultQueryErrorToast(
  query: AppQuery,
): boolean {
  return query.state.data !== undefined
}

function buildGlobalErrorKey(
  error: Error,
  query?: AppQuery,
  mutation?: AppMutation,
): string {
  const codePart =
    error instanceof BusinessError && error.code !== undefined ? String(error.code) : 'na'
  const requestIdPart =
    error instanceof BusinessError && error.requestId ? String(error.requestId) : 'na'

  if (query) {
    return `query:${JSON.stringify(query.queryKey)}:${codePart}:${requestIdPart}:${error.message}`
  }

  if (mutation) {
    return `mutation:${mutation.mutationId}:${codePart}:${requestIdPart}:${error.message}`
  }

  return error.message || 'unknown-error'
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
    const bizError = error as BusinessError
    const traceIdSuffix = bizError.traceId ? `\n\nTraceId: ${bizError.traceId}` : ''
    const requestIdSuffix = bizError.requestId ? `\nRequestId: ${bizError.requestId}` : ''
    return {
      title: $t('common.error.businessFail'), // "业务异常"
      content:
        (bizError.message === 'error' ? $t('common.status.error') : bizError.message) +
        traceIdSuffix +
        requestIdSuffix,
      originalError,
    }
  }

  // 2. 接着处理 Axios 错误
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<RFC7807Response<unknown>>

    // 2a. 服务器有响应，但状态码是 4xx/5xx
    if (axiosError.response) {
      // 尝试从响应体中获取 RFC 7807 格式的错误信息
      const problemDetails = axiosError.response.data
      const serverMessage = problemDetails?.detail || problemDetails?.title
      const traceIdSuffix = problemDetails?.traceId ? `\n\nTraceId: ${problemDetails.traceId}` : ''
      const requestId =
        readRequestIdFromBody(problemDetails) ??
        readRequestIdFromHeaders(axiosError.response.headers)
      const requestIdSuffix = requestId ? `\nRequestId: ${requestId}` : ''
      return {
        title: $t('common.error.timeout'), // "请求失败"
        content:
          (serverMessage || $t('common.error.timeoutMeta')) + traceIdSuffix + requestIdSuffix,
        originalError,
      }
    }

    // 2b. 服务器无响应（网络错误、超时等）
    if (axiosError.request) {
      return {
        title: $t('common.error.networkUnavailable'),
        content: $t('common.error.networkUnavailableMeta'),
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
      title: $t('common.error.unexpected'),
      content: error.message || $t('common.error.contactAdmin'),
      originalError,
    }
  }

  // 4. 降级处理：错误不是一个 Error 对象
  return {
    title: $t('common.error.unknown'), // "未知错误"
    content: $t('common.error.reported'), // "发生了一个未知错误"
    originalError,
  }
}
const globalBaseErrorHandler = (
  error: unknown,
  query?: AppQuery,
  mutation?: AppMutation,
) => {
  const target = query ?? mutation
  if (!target) {
    return
  }

  if (shouldSkipGlobalErrorHandler(target)) {
    return
  }

  const isDefaultToastOnError = query ? shouldShowDefaultQueryErrorToast(query) : true
  const isExecute =
    target.meta?.toastOnError === undefined ? isDefaultToastOnError : !!target.meta?.toastOnError
  if (isExecute) {
    if (error instanceof Error) {
      console.error('A global request error was caught:', error)
      const errorKey = buildGlobalErrorKey(error, query, mutation)
      const toastOnErrorConfig = target.meta?.toastOnError ?? true
      match(typeof toastOnErrorConfig)
        .with('function', () => {
          if (query) {
            const throwOnError = toastOnErrorConfig as QueryErrorToastHandler
            showUniqueErrorNotification(errorKey, throwOnError(error, query))
            return
          }

          if (mutation) {
            const throwOnError = toastOnErrorConfig as MutationErrorToastHandler
            showUniqueErrorNotification(errorKey, throwOnError(error, mutation))
          }
        })
        .with('object', () => {
          const throwOnError = toastOnErrorConfig as NaiveNotificationOptions
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
      const result = processApiError(undefined)
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
}
const globalMutationErrorHandler = (
  error: unknown,
  _context: unknown,
  _variables: unknown,
  mutation: AppMutation,
) => {
  globalBaseErrorHandler(error, undefined, mutation)
}
const globalSuccessHandler = (
  data: SuccessPayload,
  _variables: unknown,
  _context: unknown,
  query?: AppQuery,
  mutation?: AppMutation,
) => {
  const target = query ?? mutation
  if (!target) {
    return
  }
  const toastOnSuccessConfig = target.meta?.toastOnSuccess

  // best-practice: success toast 默认关闭，仅显式开启才提示（避免冗余、避免与局部 message.success 重复）。
  if (toastOnSuccessConfig === undefined || toastOnSuccessConfig === false) {
    return
  }

  if (typeof toastOnSuccessConfig === 'function') {
    if (query) {
      const toastOnSuccess = toastOnSuccessConfig as QuerySuccessToastHandler
      notification.success(toastOnSuccess(data, query))
      return
    }

    if (mutation) {
      const toastOnSuccess = toastOnSuccessConfig as MutationSuccessToastHandler
      notification.success(toastOnSuccess(data, mutation))
    }
    return
  }

  if (typeof toastOnSuccessConfig === 'object' && toastOnSuccessConfig) {
    const toastOnSuccess = toastOnSuccessConfig as NaiveNotificationOptions
    notification.success(toastOnSuccess)
    return
  }

  if (toastOnSuccessConfig === true) {
    const successDetail = (() => {
      if (!data || typeof data !== 'object') {
        return undefined
      }

      if ('config' in data && 'data' in data) {
        return (data as AxiosResponse<RFC7807Response<unknown>>).data?.detail
      }

      if ('detail' in data) {
        return (data as RFC7807Response<unknown>).detail
      }

      return undefined
    })()

    notification.success({
      title: $t('common.status.success'),
      content: successDetail ?? $t('common.status.success'),
      duration: 5000,
      keepAliveOnHover: true,
    })
  }
}
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQueryError,
    },
  },
  // --- Query 的全局错误处理 (通过订阅缓存事件) ---
  // ... (之前的 queryCache.subscribe 逻辑) ...

  // --- Mutation 的全局成功/失败提示 ---
  queryCache: new QueryCache({
    onError: globalBaseErrorHandler,
    onSuccess(data, query) {
      const result = data as SuccessPayload
      globalSuccessHandler(result, null, null, query, undefined)
    },
    onSettled(_data, _error, query) {
      clearQueryRequestId(query.queryKey)
    },
  }),
  mutationCache: new MutationCache({
    onError: globalMutationErrorHandler,
    onSuccess(data, _variables, _context, mutation) {
      const result = data as SuccessPayload
      globalSuccessHandler(result, null, null, undefined, mutation)
    },
  }),
})

let queryPersistenceEnabled = false
let queryPersistencePromise: Promise<void> | null = null

export function enableQueryPersistence(): Promise<void> {
  if (queryPersistenceEnabled) {
    return Promise.resolve()
  }

  if (!queryPersistencePromise) {
    queryPersistencePromise = Promise.all([
      import('@tanstack/query-persist-client-core'),
      import('@/app/infrastructure/query/tanstack_query_persist_with_dexie'),
    ])
      .then(async ([persistModule, persisterModule]) => {
        const [, restorePromise] = persistModule.persistQueryClient({
          queryClient,
          persister: persisterModule.queryClientPersister,
        })

        await restorePromise
        queryPersistenceEnabled = true
      })
      .catch((error) => {
        queryPersistencePromise = null
        throw error
      })
  }

  return queryPersistencePromise
}

/**
 * 初始化TanStack Query
 */
export function useRequestPlugin(): ToBeInstalledPlugin[] {
  return [
    {
      plugin: VueQueryPlugin,
      option: {
        queryClient,
      },
    },
  ]
}
