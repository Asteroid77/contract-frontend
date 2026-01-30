import type { CustomAxiosRequestConfig, ServerResponse } from '@/modules/shared/application/request/types'
import { type AxiosResponse } from 'axios'
import { apiClient } from '@/app/infrastructure/request/http-client'
import { ResponseCode } from '@/modules/shared/application/constants/response-code'
import { $t } from '@/_utils/i18n'
import { BusinessError } from '@/modules/shared/domain/errors'
/**
 * 用于项目的请求封装(unWrapper为true时)
 * @param {CustomAxiosRequestConfig<D>} config 自定义axios请求配置
 * @param {unknown[]} queryKey 请求key
 * @template T 返回值类型
 * @template D 发起请求时服务端所需参数类型
 * @return {Promise<T>}
 */
export function useRequest<T, D = unknown>(
  config: CustomAxiosRequestConfig<D> & { unWrapper?: true },
  queryKey?: unknown[],
): Promise<T>
/**
 * 用于项目的请求封装(unWrapper为false时)
 * @param {CustomAxiosRequestConfig<D>} config 自定义axios请求配置
 * @param {unknown[]} queryKey 请求key
 * @template T 返回值
 * @template D 发起请求时服务端所需参数类型
 * @return {Promise<AxiosResponse<ServerResponse<T>>>}
 */
export function useRequest<T, D = unknown>(
  config: CustomAxiosRequestConfig<D> & { unWrapper?: false },
  queryKey?: unknown[],
): Promise<AxiosResponse<ServerResponse<T>>>
/**
 * 用于项目的请求封装
 * @param {CustomAxiosRequestConfig<D>} config 自定义axios请求配置
 * @param {unknown[]} queryKey 请求key
 * @template T 返回值
 * @template D 发起请求时服务端所需参数类型
 * @return {Promise<T | AxiosResponse<ServerResponse<T>, D>>}
 */
export async function useRequest<T, D = unknown>(
  config: CustomAxiosRequestConfig<D>,
  queryKey?: unknown[],
): Promise<ServerResponse<T> | AxiosResponse<ServerResponse<T>, D>> {
  if (!queryKey) {
    queryKey = [config.url]
  }
  //请求开始时间
  const fetchStartTimestamp = new Date()
  console.log(`Request starting at ${fetchStartTimestamp},key:${queryKey}`)
  //params
  console.log(`params`, config.params, 'data', config.data)
  //data
  console.log('token', config.headers?.satoken)
  setToken(config, 'Authorization')
  try {
    const data: AxiosResponse<ServerResponse<T>> = await apiClient<
      ServerResponse<T>,
      AxiosResponse<ServerResponse<T>>,
      D
    >(config)
    // const result: ServerResponse<T> = data.data
    const fetchEndTimestamp = new Date()
    const resp = data.data
    console.log(`Request ending at ${fetchEndTimestamp}, key: ${queryKey}`)
    if (resp.code === ResponseCode.SUCCESS) {
      return _unWrapperResponseData<T>(config, data)
    }
    // 业务失败，但HTTP成功。主动创建BusinessError并抛出。
    throw new BusinessError(resp.message || $t('common.status.error'), resp.code)
  } catch (err) {
    console.error(err)
    // const error = err as AxiosError<ServerResponse<unknown>>
    // 服务端错误处理
    // httpErrorHandle(config, error)
    // 抛出异常给Promise接收方
    throw err
  }
}
function _unWrapperResponseData<T>(
  config: CustomAxiosRequestConfig,
  data: AxiosResponse<ServerResponse<T>>,
): ServerResponse<T> | AxiosResponse<ServerResponse<T>> {
  if (config.unWrap !== false) {
    return data.data
  }
  return data
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
