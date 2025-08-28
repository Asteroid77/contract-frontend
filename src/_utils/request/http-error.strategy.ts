import type {
  CustomAxiosRequestConfig,
  RequestTimeStampRecorder,
  ServerResponse,
} from '@/types/request'
import { notificationService } from '@/_utils/request/notification.service.ts'
import { type AxiosError } from 'axios'
import { minorErrFilter } from '@/_utils/request/minor-err.filter.ts'
import { criticalErrorFilter } from '@/_utils/request/critical-error.filter.ts'
import {
  exceptionRecorder,
  useSimpleRequestExceptionDataBuilder,
} from '@/_utils/exception/exception-recorder.ts'
import { $t } from '@/_utils/i18n'

/**
 * 服务器返回错误时处理
 * @param {CustomAxiosRequestConfig} config 自定义请求配置
 * @param {AxiosError<ServerResponse<unknown>>} err 服务端返回的错误响应体
 * @param {RequestTimeStampRecorder} stamp 记录请求开始与结束的时间戳对象
 */
export function httpErrorHandle(
  config: CustomAxiosRequestConfig,
  err: AxiosError<ServerResponse<unknown>>,
  stamp: RequestTimeStampRecorder,
) {
  //服务单返回的非严重错误处理
  minorErrFilter(config, err)
  //无法预见的严重服务端异常处理
  criticalErrorFilter(config, err)
}

/**
 * 服务端返回业务错误时处理
 * @param {CustomAxiosRequestConfig} config 自定义请求配置
 * @param {ServerResponse<unknown>} result 服务端响应体
 * @param {RequestTimeStampRecorder} stamp 记录请求开始与结束的时间戳对象
 */
export function businessErrorHandle<D = unknown, E = unknown, P = unknown>(
  config: CustomAxiosRequestConfig<D>,
  result: ServerResponse<E>,
  stamp: RequestTimeStampRecorder,
) {
  // 业务异常时toast弹窗提示
  notificationService(config, 'error', result.message, $t('exception.unexpected.business.title'))
  const exceptionReport = useSimpleRequestExceptionDataBuilder(config, result)
  exceptionRecorder(exceptionReport)
}
