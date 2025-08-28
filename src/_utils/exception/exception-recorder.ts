import dexie from '@/_utils/dexie'
import type { RequestExceptionExtra, ExceptionReport } from '@/types/exception'
import type { CustomAxiosRequestConfig, ServerResponse } from '@/types/request'
import type { AxiosError } from 'axios'

/**
 * 记录并上传错误日志
 * @param {ExceptionReport} data 错误数据
 * @return {Promise<string | undefined>} 成功返回id,失败返回undefined
 * @template D config.data的类型
 */
export async function exceptionRecorder<D>(data: ExceptionReport<D>): Promise<string | undefined> {
  return dexie.exceptions.add(data)
}

/**
 * 简易请求异常数据构建
 * @param {CustomAxiosRequestConfig<D>} config 自定义Axios请求配置
 * @param {AxiosError<ServerResponse<E>> | ServerResponse<E>} err 返回的异常响应体
 * @return {ExceptionReport<RequestExceptionExtra<D, P>>}
 * @template D config.data的类型
 * @template E ServerResponse<E>以及AxiosError<ServerResponse<E>>中泛型E的类型
 * @template P config.params的类型
 */
export function useSimpleRequestExceptionDataBuilder<D = unknown, E = unknown, P = unknown>(
  config: CustomAxiosRequestConfig<D>,
  err: AxiosError<ServerResponse<E>>,
): ExceptionReport<RequestExceptionExtra<D, P>>
export function useSimpleRequestExceptionDataBuilder<D = unknown, E = unknown, P = unknown>(
  config: CustomAxiosRequestConfig<D>,
  err: ServerResponse<E>,
  level?: ExceptionReport<unknown>['level'],
): ExceptionReport<RequestExceptionExtra<D, P>>
export function useSimpleRequestExceptionDataBuilder<D = unknown, E = unknown, P = unknown>(
  config: CustomAxiosRequestConfig<D>,
  err: AxiosError<ServerResponse<E>> | ServerResponse<E>,
  level?: ExceptionReport<unknown>['level'],
): ExceptionReport<RequestExceptionExtra<D, P>> {
  return {
    type: 'server',
    level: level || 'warning',
    timestamp: new Date().getTime(),
    message: err.message,
    stack: undefined,
    tags: {
      version: __GIT_TAG__,
      githash: __GIT_COMMIT_HASH__,
      branch: __GIT_BRANCH__,
    },
    extra: {
      params: config.params,
      data: config.data,
      method: config.method || 'get',
      url: config.url,
      headers: config.headers,
      response:
        (err as AxiosError<E>).isAxiosError === undefined ? err : (err as AxiosError<E>).response,
    },
  }
}
