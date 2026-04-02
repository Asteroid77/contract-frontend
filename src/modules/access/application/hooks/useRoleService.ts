import { accessService } from '@/modules/access/application/service'
import type { RolePageQuery, RoleForm } from '@/modules/access/application/models'
import type { BasePageRequest } from '@/modules/shared/application/request/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { unref, type Ref } from 'vue'
import { computed } from 'vue'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'

function resolvePositiveId(value: number): number | null {
  return value > 0 ? value : null
}

export const roleKeys = {
  all: ['role'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (filters: BasePageRequest<RolePageQuery>) => [...roleKeys.lists(), filters] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: number) => [...roleKeys.details(), id] as const,
  userRoles: (userId: number | null) => [...roleKeys.all, 'userRoles', { userId }] as const,
}

// 1. 获取角色分页列表
export const useRolePage = (
  params: Ref<BasePageRequest<RolePageQuery>> | BasePageRequest<RolePageQuery>,
  options?: {
    enabled?: Ref<boolean> | boolean
    staleTime?: number
    gcTime?: number
  },
) => {
  return useQuery({
    queryKey: computed(() => roleKeys.list(unref(params))),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => accessService.getRolePage(unref(params))),
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
  return useQuery({
    queryKey: computed(() => roleKeys.userRoles(resolvePositiveId(unref(userId)))),
    queryFn: (ctx) => {
      const id = resolvePositiveId(unref(userId))
      if (id === null) throw new Error('User ID is required')
      return withQueryRequestContext(ctx.queryKey, ctx, () => accessService.getRolesByUserId(id))
    },
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    enabled: computed(() => {
      const id = resolvePositiveId(unref(userId))
      const enabled = unref(options?.enabled ?? true)
      return enabled && id !== null
    }),
  })
}

// 3. 编辑角色（Mutation）
export const useEditRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RoleForm) => accessService.editRole(data),
    onSuccess: (data, variables) => {
      // 使角色列表缓存失效
      queryClient.invalidateQueries({
        queryKey: roleKeys.lists(),
      })
    },
    onError: (error) => {
      // 错误处理
      console.error('编辑角色失败:', error)
    },
  })
}

export const RoleService = { useRolePage, useEditRole, useRolesByUserId }
