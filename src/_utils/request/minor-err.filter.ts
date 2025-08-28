import { type AxiosError } from 'axios'
import type { CustomAxiosRequestConfig, ServerResponse } from '@/types/request'
import { HttpStatusCode } from 'axios'
import { match, P } from 'ts-pattern'
import router from '@/router'
import {
  exceptionRecorder,
  useSimpleRequestExceptionDataBuilder,
} from '@/_utils/exception/exception-recorder.ts'
import type { RequestExceptionExtra, ExceptionReport } from '@/types/exception'
import { $t } from '@/_utils/i18n'
import { ResponseCode } from '@/constant/response_code/business_code'
import { useAccountStore } from '@/stores/useAccountStore'
import { notification } from '../discrete_naive_api'
import { notificationService } from './notification.service'
import { ref } from 'vue'

const serverTimeoutNotificationInstance = ref<boolean>(false)
const serverRejectionNotificationInstance = ref<boolean>(false)
const networkUnaccessibleInstance = ref<boolean>(false)
/**
 * 对于服务端返回的轻微错误处理
 * @param {CustomAxiosRequestConfig} config 自定义axios配置
 * @param {AxiosError<ServerResponse<unknown>>} err 服务端异常响应体
 * @template D config.data的类型
 * @template E AxiosError<ServerResponse<E>>中的E类型
 */
export function minorErrFilter<D = unknown, E = unknown>(
  config: CustomAxiosRequestConfig<D>,
  err: AxiosError<ServerResponse<E>>,
) {
  match(err.code)
    .with('ECONNABORTED', () => {
      _networkTimeoutHandle(config, err)
      return
    })
    .with('ERR_NETWORK', () => {
      _networkErrorHandle()
      return
    })
    .with('ECONNREFUSED', () => {
      _networkRefuseHandle()
      return
    })
  const status: number | undefined = err.response?.status
  if (status && status >= 400 && status < 500) {
    match(err.response?.status).with(HttpStatusCode.BadRequest, () => {
      //toast弹窗提示
      notificationService(config, 'error', err.message)
      _badRequestError<D, E>(config, err)
      return
    })
  }
  const code: number | undefined = err.response?.data.code
  if (code) {
    match(code).with(
      P.union(ResponseCode.OAUTH2_TOKEN_EXPIRED, ResponseCode.OAUTH2_TOKEN_VERIFY_ERROR),
      () => {
        //toast弹窗提示
        notificationService(config, 'error', err.message)
        _unAuthorizedErrorHandle()
        return
      },
    )
  }
}

/**
 * 未登录或登录过期处理
 */
function _unAuthorizedErrorHandle() {
  //清除登录信息
  useAccountStore().logout()
  //返回login页面
  router.push({
    name: 'login',
  })
}

/**
 * 用户提交参数异常处理
 * @param {CustomAxiosRequestConfig} config 自定义axios配置
 * @param {AxiosError<ServerResponse<E>>} err 服务端异常响应体
 * @template D config.data的类型
 * @template E AxiosError<ServerResponse<E>>中泛型E的类型
 */
function _badRequestError<D = unknown, E = unknown>(
  config: CustomAxiosRequestConfig<D>,
  err: AxiosError<ServerResponse<E>>,
) {
  const data: ExceptionReport<RequestExceptionExtra<D, unknown>> =
    useSimpleRequestExceptionDataBuilder<D, E>(config, err)
  exceptionRecorder(data)
}
/**
 * 服务端应答超时提示
 */
function _networkTimeoutHandle<D = unknown, E = unknown>(
  config: CustomAxiosRequestConfig<D>,
  err: AxiosError,
) {
  if (!serverTimeoutNotificationInstance.value) {
    serverTimeoutNotificationInstance.value = true
    notification['error']({
      content: $t('exception.ECONNABORTED.meta'),
      title: $t('exception.ECONNABORTED.content'),
      closable: true,
      onClose: () => {
        serverTimeoutNotificationInstance.value = false
      },
    })
  }
  exceptionRecorder({
    type: 'server',
    level: 'error',
    timestamp: new Date().getTime(),
    message: err.message,
    tags: {
      version: __GIT_TAG__,
      branch: __GIT_BRANCH__,
      githash: __GIT_COMMIT_HASH__,
    },
    extra: {
      params: config.params,
      data: config.data,
      method: config.method,
      url: config.url,
      headers: config.headers,
      response: err.response,
    },
  })
}
/**
 * 用户无网络错误处理
 */
function _networkErrorHandle() {
  // 防止多请求重复提示无网络
  if (!networkUnaccessibleInstance.value) {
    networkUnaccessibleInstance.value = true
    notification['error']({
      title: $t('exception.ERR_USER_NETWORK_NOTWORK.content'),
      content: $t('exception.ERR_USER_NETWORK_NOTWORK.meta'),
      closable: true,
      onClose: () => {
        networkUnaccessibleInstance.value = false
      },
    })
  }
}
/**
 * 用户被服务端拒绝连接处理
 */
function _networkRefuseHandle() {
  // 防止多请求重复提示拒绝连接
  if (!serverRejectionNotificationInstance.value) {
    serverRejectionNotificationInstance.value = true
    notification['error']({
      title: $t('exception.default.meta'),
      closable: true,
      onClose: () => {
        serverRejectionNotificationInstance.value = false
      },
    })
  }
}
