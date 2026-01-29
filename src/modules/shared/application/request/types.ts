import type { AxiosRequestConfig } from 'axios'
import type { Size } from 'naive-ui/lib/pagination/src/interface'

/**
 * 自定义toast弹窗配置
 */
export interface CustomMessageStructure {
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
export type MessageStructure = { [K in keyof CustomMessageStructure]: CustomMessageStructure[K] }

/**
 * 自定义config配置中的notify配置
 */
export interface CustomNotify {
  success?: CustomMessageStructure | boolean
  error?: CustomMessageStructure | boolean
}

/**
 * 实际传递的notify配置
 */
export interface Notify {
  success: MessageStructure
  error: MessageStructure
}

/**
 * 拓展AxiosRequestConfig中的自定义配置
 */
export interface CustomAxiosRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  /**
   * toast弹窗配置
   */
  notify?: CustomNotify | boolean
  /**
   * 是否解构数据(默认解构链路AxiosResponse<ServerResponse<T> -> ServerResponse<T> -> T)
   */
  unWrap?: boolean
}

/**
 * 经过补全的自定义AxiosRequestConfig配置
 */
export interface CompletedCustomAxiosRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  /**
   * toast弹窗配置
   */
  notify: Notify
}

/**
 * 通用服务端响应体
 */
export interface ServerResponse<T> {
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
export type RequestNotificationStatus = 'success' | 'error'
/**
 * 应用于请求的toast提示的两种类型
 * - `message`: toast message方式
 * - `notification`: toast notification方式
 */
export type RequestNotificationType = 'message' | 'notification'
/**
 * 请求开始与结束的记录体
 */
export type RequestTimeStampRecorder = {
  /** 开始时间 */
  start: Date
  /** 结束时间 */
  end: Date
}

/**
 * 基础分页请求参数
 */
export interface BasePageRequest<T extends BaseQuery> {
  /**
   * 当前页码
   * @example 1~n | -1(不分页)
   */
  page?: number

  /**
   * 分页大小
   * @example 10
   */
  size?: number | Size

  /**
   * 排序规则列表
   */
  orders?: BaseOrderItem[]

  /**
   * 动态查询条件
   */
  query?: T
}

/**
 * 排序项
 */
export interface BaseOrderItem {
  /**
   * 排序字段
   */
  column: string

  /**
   * 排序方式
   * @example ASC/DESC/NATURAL
   */
  direction?: 'ASC' | 'DESC' | 'NATURAL'

  /**
   * 创建升序排序项
   * @param column 排序字段
   */
  asc?(column: string): BaseOrderItem

  /**
   * 创建降序排序项
   * @param column 排序字段
   */
  desc?(column: string): BaseOrderItem
}

/**
 * 基础查询条件接口（需要根据实际情况扩展）
 */
export type BaseQuery = {
  [key: string]: ConditionWrapper<unknown> | undefined
}

/**
 * 字段查询条件包装器
 */
export interface ConditionWrapper<T> {
  /**
   * 字段值
   */
  value?: T

  /**
   * 查询条件
   */
  condition:
    | 'eq'
    | 'like'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'ne'
    | 'in'
    | 'notIn'
    | 'between'
    | 'isNotNull'
    | 'isNull'
}

// 静态方法实现（如果需要）
export const BaseOrderItemStatic = {
  /**
   * 创建升序排序项
   * @param column 排序字段
   */
  asc: (column: string): BaseOrderItem => ({
    column,
    direction: 'ASC',
  }),

  /**
   * 创建降序排序项
   * @param column 排序字段
   */
  desc: (column: string): BaseOrderItem => ({
    column,
    direction: 'DESC',
  }),
}

export type BaseOrderItemWithStatic = BaseOrderItem & typeof BaseOrderItemStatic
// 使用示例
// const orderItem: BaseOrderItemWithStatic = { ...BaseOrderItemStatic.asc('name'), ...otherProps };

export type OrderItem = BaseOrderItem

/**
 * MyBatis Plus 完整分页结果
 * 包含所有可能的分页属性
 */
export interface IPage<T> {
  /**
   * 分页记录列表
   */
  records: T[]

  /**
   * 当前页码
   */
  current: number

  /**
   * 每页显示条数
   */
  size: number

  /**
   * 总记录数
   */
  total: number

  /**
   * 总页数
   */
  pages: number

  /**
   * 是否有上一页
   */
  hasPrevious: boolean

  /**
   * 是否有下一页
   */
  hasNext: boolean

  /**
   * 是否进行 count 查询
   */
  searchCount: boolean

  /**
   * 当前分页总页数
   */
  totalPage: number

  /**
   * 排序字段信息
   */
  orders?: OrderItem[]

  /**
   * 自动优化 COUNT SQL
   */
  optimizeCountSql: boolean

  /**
   * 是否忽略总条数查询（如果设置为 true，total 将为 0）
   */
  ignoreTotal: boolean

  /**
   * 最大每页显示条数限制
   */
  maxLimit: number
}
