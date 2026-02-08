import type { CustomAxiosRequestConfig } from '@/modules/shared/application/request/types'
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

/**
 * 用于项目的请求封装(unWrapper为true时)
 * @param {CustomAxiosRequestConfig<D>} config 自定义axios请求配置
 * @param {unknown[]} queryKey 请求key
 * @template T 返回值类型
 * @template D 发起请求时服务端所需参数类型
 * @return {Promise<T>}
 */
export function useRequest<T, D = unknown>(
  config: CustomAxiosRequestConfig<D> & { unWrap?: true },
  queryKey?: unknown[],
): Promise<RFC7807SuccessResponse<T>>
/**
 * 用于项目的请求封装(unWrapper为false时)
 * @param {CustomAxiosRequestConfig<D>} config 自定义axios请求配置
 * @param {unknown[]} queryKey 请求key
 * @template T 返回值
 * @template D 发起请求时服务端所需参数类型
 * @return {Promise<AxiosResponse<RFC7807Response<T>>>}
 */
export function useRequest<T, D = unknown>(
  config: CustomAxiosRequestConfig<D> & { unWrap?: false },
  queryKey?: unknown[],
): Promise<AxiosResponse<RFC7807SuccessResponse<T>>>
/**
 * 用于项目的请求封装
 * @param {CustomAxiosRequestConfig<D>} config 自定义axios请求配置
 * @param {unknown[]} queryKey 请求key
 * @template T 返回值
 * @template D 发起请求时服务端所需参数类型
 * @return {Promise<T | AxiosResponse<RFC7807Response<T>, D>>}
 */
export async function useRequest<T, D = unknown>(
  config: CustomAxiosRequestConfig<D>,
  queryKey?: unknown[],
): Promise<RFC7807SuccessResponse<T> | AxiosResponse<RFC7807SuccessResponse<T>, D>> {
  if (!queryKey) {
    queryKey = [config.url]
  }
  const fetchStartTimestamp = new Date()
  console.log(`Request starting at ${fetchStartTimestamp},key:${queryKey}`)
  console.log(`params`, config.params, 'data', config.data)
  console.log('token', config.headers?.satoken)
  setRequestId(config)
  setToken(config, 'Authorization')

  try {
    const response: AxiosResponse<RFC7807Response<T>> = await apiClient<
      RFC7807Response<T>,
      AxiosResponse<RFC7807Response<T>>,
      D
    >(config)

    const fetchEndTimestamp = new Date()
    console.log(`Request ending at ${fetchEndTimestamp}, key: ${queryKey}`)

    // HTTP 2xx - 成功，直接返回
    return _unWrapperResponseData<T>(config, response)
  } catch (err) {
    console.error(err)

    // 处理 Axios 错误，从响应中提取 RFC 7807 字段
    if (axios.isAxiosError(err) && err.response) {
      const problemDetails = err.response.data as RFC7807Response
      const responseRequestId = resolveResponseRequestId(err.response as AxiosResponse<RFC7807Response>)
      throw new BusinessError(
        problemDetails.detail || problemDetails.title || 'Error',
        problemDetails.code,
        problemDetails.traceId,
        responseRequestId || getRequestIdFromConfig(config),
        problemDetails.type,
        problemDetails.status,
      )
    }

    throw err
  }
}

function _unWrapperResponseData<T>(
  config: CustomAxiosRequestConfig,
  data: AxiosResponse<RFC7807Response<T>>,
): RFC7807SuccessResponse<T> | AxiosResponse<RFC7807SuccessResponse<T>> {
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

  if (config.unWrap !== false) {
    return body as RFC7807SuccessResponse<T>
  }
  return data as AxiosResponse<RFC7807SuccessResponse<T>>
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

function setToken(config: CustomAxiosRequestConfig, tokenName: string) {
  config.headers = config.headers || {}
  let token = config.headers[tokenName]

  if (!token) {
    const defaultHeaders = apiClient.defaults.headers
    token = defaultHeaders?.common?.[tokenName] || defaultHeaders?.[tokenName]
  }

  if (!token) {
    token = localStorage.getItem('ACCESS_TOKEN')

    if (token) {
      config.headers[tokenName] = token
    }
  }
}
