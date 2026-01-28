import { userApi } from '@/api/user.api'
import type { UserPageDTO, UserPageVO } from '@/types/account'
import type { BasePageRequest, IPage, ServerResponse } from '@/types/request'
import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { computed, unref, type Ref } from 'vue'

export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (params: BasePageRequest<UserPageDTO>) => [...userQueryKeys.lists(), params] as const,
}

/**
 * 获取用户分页数据
 */
export const useUserPage = (
  pageRequest: Ref<BasePageRequest<UserPageDTO>> | BasePageRequest<UserPageDTO>,
  options?: {
    enabled?: Ref<boolean> | boolean
    staleTime?: number
    gcTime?: number
    refetchOnWindowFocus?: boolean
  },
) => {
  return useQuery<
    ServerResponse<IPage<UserPageVO>>,
    AxiosError<ServerResponse<unknown>>,
    IPage<UserPageVO>
  >({
    queryKey: computed(() => userQueryKeys.list(unref(pageRequest))),
    queryFn: () => userApi.getUserPage(unref(pageRequest)),
    placeholderData: keepPreviousData, // 分页时保持旧数据
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5分钟
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10分钟
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
  })
}
