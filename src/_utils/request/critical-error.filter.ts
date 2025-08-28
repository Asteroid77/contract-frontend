import type { CustomAxiosRequestConfig, ServerResponse } from '@/types/request'
import type { AxiosError } from 'axios'
import { notificationService } from '@/_utils/request/notification.service.ts'
import type { RequestExceptionExtra, ExceptionReport } from '@/types/exception'
import { exceptionRecorder } from '@/_utils/exception/exception-recorder.ts'
import { $t } from '@/_utils/i18n'

/**
 * 对于服务端返回的异常错误处理
 * @param {CustomAxiosRequestConfig} config
 * @param {AxiosError<ServerResponse<unknown>>} err
 */
export function criticalErrorFilter<D = unknown, E = unknown>(
  config: CustomAxiosRequestConfig<D>,
  err: AxiosError<ServerResponse<E>>,
) {
  /**
   * 对于预期外的错误，服务端返回的message不应直接展现给用户。
   */
  const status = err.status
  if (status && status >= 500) {
    notificationService(
      config,
      'error',
      $t('exception.unexpected.message'),
      $t('exception.unexpected.title'),
    )
    const data: ExceptionReport<RequestExceptionExtra<D, unknown>> = {
      type: 'server',
      level: 'fatal',
      timestamp: new Date().getTime(),
      message: err.message,
      stack: undefined,
      tags: {
        version: __GIT_TAG__,
        branch: __GIT_BRANCH__,
        githash: __GIT_COMMIT_HASH__,
      },
      extra: {
        params: config.params,
        data: config.data,
        method: config.method || 'get',
        url: config.url,
        headers: config.headers,
      },
    }
    exceptionRecorder(data)
  }
}
