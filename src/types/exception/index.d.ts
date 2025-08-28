import type { CustomAxiosRequestConfig } from '@/types/request'

/**
 * 错误记录传输体
 */
declare interface ExceptionReport<E> {
  id?: string
  /**
   * 自定义错误类型
   */
  type: 'vue' | 'server' | 'network' | 'js'
  /** 错误描述信息 */
  message: string
  /**
   * 消息级别
   * - info 事件
   * - warning 警告
   * - error 错误
   * - fatal 致命
   */
  level: 'info' | 'warning' | 'error' | 'fatal'
  /** 堆栈信息 */
  stack?: string // 堆栈信息，配合sourceMap使用
  /** Sentry自定义标签 */
  tags?: {
    [key: string]: unknown
    branch: string
    githash: string
    version: string | number
  } // Sentry 自定义标签
  /** 额外信息 (context) */
  extra?: E
  /** 用户信息 */
  user?: {
    id: string // 用户ID
    phone?: string // 用户手机
    username?: string // 用户名
  }
  /** Sentry 返回的事件ID */
  sentryEventId?: string
  /** 错误发生时间戳 */
  timestamp: number
}

declare interface RequestExceptionExtra<D, P> {
  url?: string
  data?: D
  params?: P
  method: CustomAxiosRequestConfig<D>['method']
  headers: CustomAxiosRequestConfig<D>['headers']
  response?: unknown
}
