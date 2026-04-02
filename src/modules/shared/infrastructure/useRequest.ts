import type {
  CustomAxiosRequestConfig,
  RequestResponseShape,
} from '@/modules/shared/application/request/types'
import type { RFC7807Response, RFC7807SuccessResponse } from '@/modules/shared/domain/response'
import { type AxiosResponse } from 'axios'
import axios from 'axios'
import { apiClient } from '@/app/infrastructure/request/http-client'
import { BusinessError } from '@/modules/shared/domain/errors'
import {
  createRequestId,
  normalizeRequestId,
  REQUEST_ID_HEADER,
  resolveResponseRequestId,
} from '@/app/infrastructure/request/request-id'
import { getCurrentRequestContext } from '@/app/infrastructure/request/request-context'
import {
  forceRefreshAccessToken,
  getStoredAccessToken,
  hasStoredRefreshToken,
  isLogoutInProgress,
} from '@/modules/access/application/token-manager'
import {
  isRecoverableAuthSessionError,
  recoverAuthSession,
} from '@/modules/access/application/auth-session-recovery'
import { ResponseCode } from '@/modules/shared/application/constants/response-code'
import { reportAuthErrorFeedback } from '@/modules/shared/infrastructure/request-auth-feedback'

export function useRequest<T, D = unknown>(
  config: CustomAxiosRequestConfig<D> & { responseShape: 'data' },
  queryKey?: unknown[],
): Promise<T>
export function useRequest<T, D = unknown>(
  config: CustomAxiosRequestConfig<D> & { responseShape: 'envelope' },
  queryKey?: unknown[],
): Promise<RFC7807SuccessResponse<T>>
export function useRequest<T, D = unknown>(
  config: CustomAxiosRequestConfig<D> & { responseShape: 'raw' },
  queryKey?: unknown[],
): Promise<AxiosResponse<RFC7807SuccessResponse<T>>>
export function useRequest<T, D = unknown>(
  config: CustomAxiosRequestConfig<D> & {
    responseShape?: undefined
  },
  queryKey?: unknown[],
): Promise<T>
export async function useRequest<T, D = unknown>(
  config: CustomAxiosRequestConfig<D>,
  queryKey?: unknown[],
): Promise<T | RFC7807SuccessResponse<T> | AxiosResponse<RFC7807SuccessResponse<T>, D>> {
  if (!queryKey) {
    queryKey = [config.url]
  }

  setRequestId(config)

  try {
    return await executeRequest<T, D>(config)
  } catch (error) {
    if (shouldRetryWithTokenRefresh(error, config)) {
      try {
        config._authRetried = true
        if (!shouldRefreshBeforeRetry(config)) {
          return await executeRequest<T, D>(config, true)
        }

        await forceRefreshAccessToken()
        return await executeRequest<T, D>(config, true)
      } catch (retryError) {
        return await throwMappedRequestError(retryError, config)
      }
    }

    return await throwMappedRequestError(error, config)
  }
}

async function executeRequest<T, D>(
  config: CustomAxiosRequestConfig<D>,
  forceReloadToken: boolean = false,
): Promise<T | RFC7807SuccessResponse<T> | AxiosResponse<RFC7807SuccessResponse<T>, D>> {
  config._authTokenUsed = setToken(config, 'Authorization', forceReloadToken)

  const response: AxiosResponse<RFC7807Response<T>> = await apiClient<
    RFC7807Response<T>,
    AxiosResponse<RFC7807Response<T>>,
    D
  >(config)

  return resolveResponsePayload<T, D>(config, response)
}

function shouldRetryWithTokenRefresh(error: unknown, config: CustomAxiosRequestConfig): boolean {
  if (
    config.skipAuthRefresh ||
    config._authRetried ||
    !hasStoredRefreshToken() ||
    isLogoutInProgress()
  ) {
    return false
  }

  if (!axios.isAxiosError(error) || !error.response) {
    return false
  }

  const problemDetails = error.response.data as RFC7807Response | undefined
  const status = error.response.status ?? problemDetails?.status
  const code = problemDetails?.code

  return (
    status === 401 ||
    code === 401 ||
    code === ResponseCode.OAUTH2_TOKEN_VERIFY_ERROR ||
    code === ResponseCode.OAUTH2_TOKEN_EXPIRED
  )
}

function shouldRefreshBeforeRetry(config: CustomAxiosRequestConfig): boolean {
  const usedToken = normalizeAccessToken(config._authTokenUsed)
  const latestToken = normalizeAccessToken(getStoredAccessToken() ?? undefined)

  // 请求发送后 access token 已被其他请求/标签页更新，此时只需用最新 token 重放。
  // 避免旧 token 的并发 401 在短时间内重复触发 refresh。
  if (usedToken && latestToken && usedToken !== latestToken) {
    return false
  }

  return true
}

async function throwMappedRequestError(
  error: unknown,
  config: CustomAxiosRequestConfig,
): Promise<never> {
  console.error(error)

  if (axios.isAxiosError(error) && error.response) {
    const problemDetails = error.response.data as RFC7807Response
    const responseRequestId = resolveResponseRequestId(
      error.response as AxiosResponse<RFC7807Response>,
    )

    const mappedError = new BusinessError(
      problemDetails.detail || problemDetails.title || 'Error',
      problemDetails.code,
      problemDetails.traceId,
      responseRequestId || getRequestIdFromConfig(config),
      problemDetails.type,
      problemDetails.status,
    )

    reportAuthErrorFeedback(mappedError)
    if (isRecoverableAuthSessionError(mappedError)) {
      await recoverAuthSession(mappedError)
    }
    throw mappedError
  }

  if (error instanceof BusinessError) {
    reportAuthErrorFeedback(error)
    if (isRecoverableAuthSessionError(error)) {
      await recoverAuthSession(error)
    }
  }

  throw error
}

function resolveResponsePayload<T, D>(
  config: CustomAxiosRequestConfig,
  data: AxiosResponse<RFC7807Response<T>, D>,
): T | RFC7807SuccessResponse<T> | AxiosResponse<RFC7807SuccessResponse<T>, D> {
  const body = data.data
  const responseRequestId =
    resolveResponseRequestId(data as AxiosResponse<RFC7807Response<unknown>>) ||
    getRequestIdFromConfig(config)
  body.requestId = responseRequestId
  data.data.requestId = responseRequestId

  if (body.data === undefined) {
    throw new BusinessError(
      body.detail || body.title || 'Response data is missing',
      body.code,
      body.traceId,
      body.requestId || getRequestIdFromConfig(config),
      body.type,
      body.status,
    )
  }

  const responseShape = resolveResponseShape(config)

  if (responseShape === 'data') {
    return body.data as T
  }

  if (responseShape === 'envelope') {
    return body as RFC7807SuccessResponse<T>
  }

  return data as AxiosResponse<RFC7807SuccessResponse<T>, D>
}

function resolveResponseShape(config: CustomAxiosRequestConfig): RequestResponseShape {
  return config.responseShape ?? 'data'
}

function setRequestId(config: CustomAxiosRequestConfig) {
  const currentContext = getCurrentRequestContext()
  const requestId =
    normalizeRequestId(config.requestContext?.requestId) ??
    normalizeRequestId(currentContext?.requestId) ??
    normalizeRequestId(config.headers?.[REQUEST_ID_HEADER]) ??
    normalizeRequestId(config.headers?.[REQUEST_ID_HEADER.toLowerCase()]) ??
    createRequestId()

  config.requestContext = {
    ...(currentContext ?? {}),
    ...(config.requestContext ?? {}),
    requestId,
  }

  config.headers = {
    ...(config.headers ?? {}),
    [REQUEST_ID_HEADER]: requestId,
  }

  if (config.requestContext.signal && !config.signal) {
    config.signal = config.requestContext.signal
  }
}

function getRequestIdFromConfig(config: CustomAxiosRequestConfig): string {
  return (
    normalizeRequestId(config.requestContext?.requestId) ??
    normalizeRequestId(config.headers?.[REQUEST_ID_HEADER]) ??
    normalizeRequestId(config.headers?.[REQUEST_ID_HEADER.toLowerCase()]) ??
    ''
  )
}

function setToken(
  config: CustomAxiosRequestConfig,
  tokenName: string,
  forceReloadToken: boolean = false,
): string | undefined {
  if (config.skipAuthToken) {
    return undefined
  }

  config.headers = config.headers || {}

  if (forceReloadToken) {
    delete config.headers[tokenName]
  }

  let token = config.headers[tokenName]

  if (!token) {
    const defaultHeaders = apiClient.defaults.headers
    token = defaultHeaders?.common?.[tokenName] || defaultHeaders?.[tokenName]
  }

  if (!token) {
    token = getStoredAccessToken()

    if (token) {
      config.headers[tokenName] = token
    }
  }

  return normalizeAccessToken(token)
}

function normalizeAccessToken(token: unknown): string | undefined {
  if (typeof token !== 'string') {
    return undefined
  }

  if (token.startsWith('Bearer ')) {
    return token.slice('Bearer '.length)
  }

  return token
}
