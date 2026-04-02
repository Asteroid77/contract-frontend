import '@tanstack/vue-query'
import type { Mutation, Query } from '@tanstack/vue-query'
import type { NotificationOptions as NaiveNotificationOptions } from 'naive-ui'

type AppQueryKey = readonly [string, ...ReadonlyArray<unknown>]

type AppQuery = Query<unknown, unknown, unknown, AppQueryKey>
type AppMutation = Mutation<unknown, unknown, unknown, unknown>

type QueryErrorToastHandler = (error: Error, query: AppQuery) => NaiveNotificationOptions

type QuerySuccessToastHandler = (data: unknown, query: AppQuery) => NaiveNotificationOptions

type MutationErrorToastHandler = (error: Error, mutation: AppMutation) => NaiveNotificationOptions

type MutationSuccessToastHandler = (
  data: unknown,
  mutation: AppMutation,
) => NaiveNotificationOptions

interface AppQueryMeta extends Record<string, unknown> {
  skipGlobalErrorHandler?: boolean
  toastOnError?: boolean | NaiveNotificationOptions | QueryErrorToastHandler
  toastOnSuccess?: boolean | NaiveNotificationOptions | QuerySuccessToastHandler
}

interface AppMutationMeta extends Record<string, unknown> {
  skipGlobalErrorHandler?: boolean
  toastOnError?: boolean | NaiveNotificationOptions | MutationErrorToastHandler
  toastOnSuccess?: boolean | NaiveNotificationOptions | MutationSuccessToastHandler
}

declare module '@tanstack/vue-query' {
  interface Register {
    queryKey: AppQueryKey
    mutationKey: AppQueryKey
    queryMeta: AppQueryMeta
    mutationMeta: AppMutationMeta
  }
}
