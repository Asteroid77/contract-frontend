import '@tanstack/vue-query'
// 从库中导入基础类型，以便在声明中使用
import type { Query, Mutation, QueryKey } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import type { NotificationOptions as NaiveNotificationOptions } from 'naive-ui'
import type { ServerResponse } from '../request'

// 为 TanStack Query 的泛型定义一些别名，使其更清晰
type TData = unknown
type TError = AxiosError<ServerResponse<unknown>>
type TVariables = unknown
type TContext = unknown

declare module '@tanstack/vue-query' {
  // 扩展 QueryMeta 接口
  // TQueryFnData: 查询函数返回的数据类型
  // TError: 错误的类型
  // TData: select转换后的数据类型
  export interface QueryMeta<
    TQueryFnData = unknown,
    TError = AxiosError<ServerResponse<unknown>>,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  > {
    skipGlobalErrorHandler?: boolean
    toastOnError?:
      | boolean
      | string
      | ((
          error: TError,
          query: Query<TQueryFnData, TError, TData, TQueryKey>,
        ) => NaiveNotificationOptions | string)
      | NaiveNotificationOptions
    toastOnSuccess?:
      | boolean
      | string
      | ((
          data: TData,
          query: Query<TQueryFnData, TError, TData, TQueryKey>,
        ) => NaiveNotificationOptions | string)
      | NaiveNotificationOptions
  }

  // 扩展 MutationMeta 接口
  // TData: mutation函数返回的数据类型
  // TError: 错误的类型
  // TVariables: 传递给mutation函数的变量类型
  // TContext: onMutate返回的上下文类型
  export interface MutationMeta<
    TData = unknown,
    TError = AxiosError<ServerResponse<unknown>>,
    TVariables = void,
    TContext = unknown,
  > {
    skipGlobalErrorHandler?: boolean
    toastOnError?:
      | boolean
      | string
      | ((
          error: TError,
          variables: TVariables,
          context: TContext | undefined,
          mutation: Mutation<TData, TError, TVariables, TContext>,
        ) => NaiveNotificationOptions | string)
      | NaiveNotificationOptions
    toastOnSuccess?:
      | boolean
      | string
      | ((
          data: TData,
          variables: TVariables,
          context: TContext | undefined,
          mutation: Mutation<TData, TError, TVariables, TContext>,
        ) => NaiveNotificationOptions | string)
      | NaiveNotificationOptions
  }
}
