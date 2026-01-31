import { invitationService } from '@/modules/invitation/application/service'
import type { InvitationCode, InvitationUpdateForm } from '@/modules/invitation/application/models'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

// 查询键前缀
export const invitationKeys = {
  all: ['invitations'] as const,
  lists: () => [...invitationKeys.all, 'list'] as const,
  list: (filters: string) => [...invitationKeys.lists(), { filters }] as const,
  count: () => [...invitationKeys.all, 'count'] as const,
}

/**
 * 获取邀请码列表的 Hook
 */
export const useInvitationCodeListQuery = () => {
  return useQuery<InvitationCode[], unknown, InvitationCode[]>({
    queryKey: invitationKeys.lists(),
    queryFn: () => invitationService.getInvitationCodeList(),
  })
}

/**
 * 获取已邀请人数的 Hook
 */
export const useInvitatedCountQuery = () => {
  return useQuery<number, unknown, number>({
    queryKey: invitationKeys.count(),
    queryFn: () => invitationService.getInvitedCount(),
  })
}

// =================================================================
// MUTATIONS (用于创建、更新、删除数据 - POST, PUT, DELETE)
// =================================================================

/**
 * 创建邀请码的 Hook
 */
export const useCreateInvitationCodeMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => invitationService.createInvitationCode(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() })
    },
  })
}

/**
 * 更新邀请码的 Hook
 */
export const useUpdateInvitationCodeMutation = (successCallback: () => void) => {
  const queryClient = useQueryClient()

  return useMutation({
    // mutationFn 接收的参数会从 .mutate(params) 传递过来
    mutationFn: (params: InvitationUpdateForm[]) => invitationService.updateInvitationCode(params),
    onSuccess: () => {
      // 更新成功后，同样让列表缓存失效
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() })
      successCallback()
    },
  })
}
/**
 * 软删除邀请码的Hook
 */
export const useDeleteInvitationCodeMutation = (successCallback: () => void) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: number[]) => invitationService.deleteInvitationCode(params),
    onSuccess: () => {
      // 更新成功后，同样让列表缓存失效
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists() })
      successCallback()
    },
  })
}
