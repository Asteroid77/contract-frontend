import type { AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * 自定义toast弹窗配置
 */
declare interface CustomMessageStructure {
  /** 弹窗类型 */
  type: 'message' | 'notification'
  /** toast message */
  message?: string
  /** toast title */
  title?: string
  /** 是否弹窗 */
  trigger?: boolean
}
/**
 * 实际传递的toast弹窗配置
 */
type MessageStructure = { [K in keyof CustomMessageStructure]: CustomMessageStructure[K] }

/**
 * 自定义config配置中的notify配置
 */
declare interface CustomNotify {
  success?: CustomMessageStructure | boolean
  error?: CustomMessageStructure | boolean
}

/**
 * 实际传递的notify配置
 */
declare interface Notify {
  success: MessageStructure
  error: MessageStructure
}

/**
 * 拓展AxiosRequestConfig中的自定义配置
 */
declare interface CustomAxiosRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  /**
   * toast弹窗配置
   */
  notify?: CustomNotify | boolean
  /**
   * 是否解构数据(默认解构链路AxiosResponse<ServerResponse<T> -> ServerResponse<T> -> T)
   */
  unWrapper?: boolean
}

/**
 * 经过补全的自定义AxiosRequestConfig配置
 */
declare interface CompletedCustomAxiosRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  /**
   * toast弹窗配置
   */
  notify: Notify
}

/**
 * 通用服务端响应体
 */
declare interface ServerResponse<T> {
  /**
   * 业务code
   */
  code: number
  /**
   * 服务端返回message
   */
  message: string
  /**
   * 服务端数据响应体
   */
  data: T
  /**
   * 服务端返回status
   */
  status: string | number
}
/**
 * 应用于请求的toast提示的两种状态
 * - `success`: 请求成功
 * - `error`: 请求失败（业务、服务端异常、本地网络异常）
 */
type RequestNotificationStatus = 'success' | 'error'
/**
 * 应用于请求的toast提示的两种类型
 * - `message`: toast message方式
 * - `notification`: toast notification方式
 */
type RequestNotificationType = 'message' | 'notification'
/**
 * 请求开始与结束的记录体
 */
type RequestTimeStampRecorder = {
  /** 开始时间 */
  start: Date
  /** 结束时间 */
  end: Date
}
