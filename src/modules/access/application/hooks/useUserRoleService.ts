import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref, unref } from 'vue'
import { accessService } from '@/modules/access/application/service'
import type { RoleAssignRequest } from '@/modules/access/application/models'
import { roleKeys } from './useRoleService'
import { userQueryKeys } from '@/modules/user/application/hooks/useUserPage'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import { $t } from '@/_utils/i18n'

function resolvePositiveId(value: number | undefined | null): number | null {
  return typeof value === 'number' && value > 0 ? value : null
}

// Query Keys
export const userRoleKeys = {
  all: ['userRole'] as const,
  assignedUsers: () => [...userRoleKeys.all, 'assignedUsers'] as const,
  assignedUsersByRole: (roleId: number | null) =>
    [...userRoleKeys.assignedUsers(), { roleId }] as const,
  assignedRoles: () => [...userRoleKeys.all, 'assignedRoles'] as const,
  assignedRolesToUser: (userId: number | null) =>
    [...userRoleKeys.assignedRoles(), { userId }] as const,
}

/**
 * 获取指定角色下的已分配用户
 */
export const useAssignedUsersByRole = (
  roleId: Ref<number | undefined> | number | undefined | null,
  options?: {
    enabled?: Ref<boolean> | boolean
    staleTime?: number
    gcTime?: number
    refetchOnWindowFocus?: boolean
  },
) => {
  return useQuery({
    queryKey: computed(() => {
      const id = resolvePositiveId(unref(roleId))
      return userRoleKeys.assignedUsersByRole(id)
    }),
    queryFn: (ctx) => {
      const id = resolvePositiveId(unref(roleId))
      if (id === null) throw new Error('Role ID is required')
      return withQueryRequestContext(ctx.queryKey, ctx, () =>
        accessService.getAssignedUsersByRoleId(id),
      )
    },
    enabled: computed(() => {
      const id = resolvePositiveId(unref(roleId))
      const enabled = unref(options?.enabled ?? true)
      return enabled && id !== null
    }),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5分钟
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10分钟
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
  })
}
/**
 * 角色分配 Mutation Hook
 */
export const useAssignRoleToUsers = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RoleAssignRequest) => accessService.assignRoleToUsers(data),
    onSuccess: () => {
      // 也可以使角色列表缓存失效
      queryClient.invalidateQueries({
        queryKey: roleKeys.lists(),
      })

      // 如果有用户列表，也使其失效
      queryClient.invalidateQueries({
        queryKey: userQueryKeys.lists(),
      })
    },
    meta: {
      toastOnSuccess: {
        title: $t('common.status.success'),
        content: $t('system.role.message.assignSuccess'),
        duration: 5000,
        keepAliveOnHover: true,
      },
    },
  })
}
