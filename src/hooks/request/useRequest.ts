import type { CustomAxiosRequestConfig, ServerResponse } from '@/types/request'
import type { AxiosResponse, AxiosError } from 'axios'
import { notificationService } from '@/_utils/request/notification.service.ts'
import { match } from 'ts-pattern'
import { businessErrorStrategy } from '@/_utils/request/business-error.strategy.ts'
import { businessErrorHandle, httpErrorHandle } from '@/_utils/request/http-error.strategy.ts'
import { apiClient } from '@/_utils/request/http-client.ts'
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
): Promise<T | AxiosResponse<ServerResponse<T>, D>> {
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
  try {
    const data: AxiosResponse<ServerResponse<T>> = await apiClient<
      ServerResponse<T>,
      AxiosResponse<ServerResponse<T>>,
      D
    >(config)
    const result: ServerResponse<T> = data.data
    const fetchEndTimestamp = new Date()
    console.log(`Request ending at ${fetchEndTimestamp}, key: ${queryKey}`)
    _handleNotification<T, D>(config, result, fetchStartTimestamp, fetchEndTimestamp)
    //业务错误处理
    businessErrorStrategy(config, data, {
      start: fetchStartTimestamp,
      end: fetchEndTimestamp,
    })
    //返回值处理
    return _unWrapperResponseData<T>(config, data)
  } catch (err) {
    console.error(err)
    const fetchEndTimestamp = new Date()
    const error = err as AxiosError<ServerResponse<unknown>>
    // 服务端错误处理
    httpErrorHandle(config, error, {
      start: fetchStartTimestamp,
      end: fetchEndTimestamp,
    })
    // 抛出异常给Promise接收方
    throw error
  }
}
function _unWrapperResponseData<T>(
  config: CustomAxiosRequestConfig,
  data: AxiosResponse<ServerResponse<T>>,
) {
  if (config.unWrapper !== false) {
    return data.data.data
  }
  return data
}
function _handleNotification<T, D>(
  config: CustomAxiosRequestConfig<D>,
  result: ServerResponse<T>,
  fetchStartTimestamp: Date,
  fetchEndTimestamp: Date,
) {
  const matchResult = match(result.code)
    .when(
      (code) => code !== 10000,
      () => {
        // 业务异常处理
        businessErrorHandle<D>(config, result, {
          start: fetchStartTimestamp,
          end: fetchEndTimestamp,
        })
        return false
      },
    )
    .otherwise(() => true)
  //接口请求成功后
  if (matchResult) {
    // 成功时toast弹窗提示
    notificationService(config, 'success', result.message)
  }
}
