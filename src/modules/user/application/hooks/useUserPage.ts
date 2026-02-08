import { userService } from '@/modules/user/application/service'
import type { UserPageQuery, UserPageItem } from '@/modules/user/application/models'
import type { BasePageRequest, IPage } from '@/modules/shared/application/request/types'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { computed, unref, type Ref } from 'vue'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'

export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (params: BasePageRequest<UserPageQuery>) => [...userQueryKeys.lists(), params] as const,
}

/**
 * 获取用户分页数据
 */
export const useUserPage = (
  pageRequest: Ref<BasePageRequest<UserPageQuery>> | BasePageRequest<UserPageQuery>,
  options?: {
    enabled?: Ref<boolean> | boolean
    staleTime?: number
    gcTime?: number
    refetchOnWindowFocus?: boolean
  },
) => {
  return useQuery<IPage<UserPageItem>, AxiosError<unknown>, IPage<UserPageItem>>({
    queryKey: computed(() => userQueryKeys.list(unref(pageRequest))),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => userService.getUserPage(unref(pageRequest))),
    placeholderData: keepPreviousData, // 分页时保持旧数据
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5分钟
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10分钟
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
  })
}
