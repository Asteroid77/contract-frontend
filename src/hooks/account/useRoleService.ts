import { roleApi } from '@/api/role.api'
import type { RolePageDTO, RoleRequest, RoleVO } from '@/api/types/role'
import type { BasePageRequest, IPage, ServerResponse } from '@/types/request'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { unref, type Ref } from 'vue'
import { computed } from 'vue'

export const roleKeys = {
  all: ['role'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (filters: BasePageRequest<RolePageDTO>) => [...roleKeys.lists(), filters] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: number) => [...roleKeys.details(), id] as const,
  userRoles: (userId: number) => [...roleKeys.all, 'user', userId] as const,
}

// 1. 获取角色分页列表
export const useRolePage = (
  params: Ref<BasePageRequest<RolePageDTO>> | BasePageRequest<RolePageDTO>,
  options?: {
    enabled?: Ref<boolean> | boolean
    staleTime?: number
    gcTime?: number
  },
) => {
  return useQuery<
    ServerResponse<IPage<RoleVO>>,
    AxiosError<ServerResponse<unknown>>,
    IPage<RoleVO>
  >({
    queryKey: computed(() => roleKeys.list(unref(params))),
    queryFn: () => roleApi.getPage(unref(params)),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5分钟
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10分钟
    enabled: options?.enabled ?? true,
  })
}
// 2. 根据用户ID获取角色列表
export const useRolesByUserId = (
  userId: Ref<number> | number,
  options?: {
    enabled?: Ref<boolean> | boolean
    staleTime?: number
  },
) => {
  return useQuery<ServerResponse<RoleVO[]>, AxiosError<ServerResponse<unknown>>, RoleVO[]>({
    queryKey: computed(() => roleKeys.userRoles(unref(userId))),
    queryFn: () => roleApi.getRoleListByUserId(unref(userId)),
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    enabled: computed(() => {
      const id = unref(userId)
      const enabled = unref(options?.enabled ?? true)
      return enabled && !!id
    }),
  })
}

// 3. 编辑角色（Mutation）
export const useEditRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RoleRequest) => roleApi.edit(data),
    onSuccess: (data, variables) => {
      // 使角色列表缓存失效
      queryClient.invalidateQueries({
        queryKey: roleKeys.lists(),
      })

      // 如果编辑的角色有关联用户，也可以使相关用户的角色缓存失效
      if (variables.id) {
        queryClient.invalidateQueries({
          queryKey: roleKeys.userRoles(variables.id),
        })
      }
    },
    onError: (error) => {
      // 错误处理
      console.error('编辑角色失败:', error)
    },
  })
}

export const RoleService = { useRolePage, useEditRole, useRolesByUserId }
