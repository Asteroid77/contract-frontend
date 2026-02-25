import { userService } from '@/modules/user/application/service'
import type {
  UserAdditionalInfo,
  UserPageItem,
  UserPageRequest,
} from '@/modules/user/application/models'
import type { IPage } from '@/modules/shared/application/request/types'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { computed, unref, type Ref } from 'vue'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'

export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (params: UserPageRequest) => [...userQueryKeys.lists(), params] as const,
  detail: (userId: number) => [...userQueryKeys.all, 'detail', userId] as const,
}

/**
 * 获取用户分页数据
 */
export const useUserPage = (
  pageRequest: Ref<UserPageRequest> | UserPageRequest,
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

/**
 * 获取指定用户详细信息（附加信息）
 */
export const useUserInfoById = (
  userId: Ref<number | null | undefined> | number | null | undefined,
  options?: {
    enabled?: Ref<boolean> | boolean
    staleTime?: number
    gcTime?: number
    refetchOnWindowFocus?: boolean
  },
) => {
  return useQuery<UserAdditionalInfo | null, AxiosError<unknown>, UserAdditionalInfo | null>({
    queryKey: computed(() => {
      const id = unref(userId)
      return id && id > 0 ? userQueryKeys.detail(id) : [...userQueryKeys.all, 'detail', 'empty']
    }),
    queryFn: (ctx) => {
      const id = unref(userId)
      if (!id || id <= 0) return Promise.resolve(null)
      return withQueryRequestContext(ctx.queryKey, ctx, () => userService.getUserInfoById(id))
    },
    enabled: computed(() => {
      const id = unref(userId)
      const enabled = unref(options?.enabled ?? true)
      return enabled && !!id && id > 0
    }),
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    gcTime: options?.gcTime ?? 10 * 60 * 1000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
  })
}

/**
 * 删除（禁用）用户
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: number) => userService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: userQueryKeys.lists(),
      })
    },
  })
}
