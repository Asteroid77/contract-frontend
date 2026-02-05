/**
 * RFC 7807 Problem Details 扩展格式
 * @see https://tools.ietf.org/html/rfc7807
 */
export interface RFC7807Response<T = unknown> {
  /** URI 标识问题类型，成功时为 "about:blank" */
  type: string
  /** 简短标题 */
  title: string
  /** HTTP 状态码 */
  status: number
  /** 详细描述 */
  detail: string
  /** 请求实例 URI */
  instance?: string
  /** 业务错误码 */
  code: number
  /** 追踪 ID */
  traceId: string
  /** 业务数据（仅成功时存在） */
  data?: T
}

/**
 * RFC 7807 成功响应（保证 `data` 存在）
 *
 * 说明：
 * - 在本项目中，HTTP 非 2xx 会通过 axios 抛错并被统一转换为 BusinessError；
 * - 因此在“成功链路”里可将响应体收敛为 data 必填。
 */
export type RFC7807SuccessResponse<T> = Omit<RFC7807Response<T>, 'data'> & { data: T }

/** 判断是否为错误响应 */
export function isErrorResponse(response: RFC7807Response): boolean {
  return response.status >= 400
}

/**
 * @deprecated Use RFC7807Response instead
 */
export type ServerResponse<T> = RFC7807Response<T>
