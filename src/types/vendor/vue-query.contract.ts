import type { MutationObserverOptions, QueryKey, QueryObserverOptions } from '@tanstack/vue-query'

type Assert<T extends true> = T

type QueryMeta = NonNullable<QueryObserverOptions['meta']>
type MutationMeta = NonNullable<MutationObserverOptions['meta']>

type AppQueryKeyStartsWithString = Assert<
  QueryKey extends readonly [infer _Head extends string, ...ReadonlyArray<unknown>] ? true : false
>

type QueryErrorToastDisallowsString = Assert<
  Extract<NonNullable<QueryMeta['toastOnError']>, string> extends never ? true : false
>

type QuerySuccessToastDisallowsString = Assert<
  Extract<NonNullable<QueryMeta['toastOnSuccess']>, string> extends never ? true : false
>

type MutationErrorToastDisallowsString = Assert<
  Extract<NonNullable<MutationMeta['toastOnError']>, string> extends never ? true : false
>

type MutationSuccessToastDisallowsString = Assert<
  Extract<NonNullable<MutationMeta['toastOnSuccess']>, string> extends never ? true : false
>

export type VueQueryTypeContract = {
  queryKey: AppQueryKeyStartsWithString
  queryErrorToast: QueryErrorToastDisallowsString
  querySuccessToast: QuerySuccessToastDisallowsString
  mutationErrorToast: MutationErrorToastDisallowsString
  mutationSuccessToast: MutationSuccessToastDisallowsString
}
