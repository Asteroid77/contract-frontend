import { invitationService } from '@/modules/invitation/application/service'
import type { InvitationUpdateForm } from '@/modules/invitation/application/models'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import { $t } from '@/_utils/i18n'

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
  return useQuery({
    queryKey: invitationKeys.lists(),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => invitationService.getInvitationCodeList()),
  })
}

/**
 * 获取已邀请人数的 Hook
 */
export const useInvitatedCountQuery = () => {
  return useQuery({
    queryKey: invitationKeys.count(),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => invitationService.getInvitedCount()),
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
    meta: {
      toastOnSuccess: {
        title: $t('common.status.success'),
        content: $t('domain.invitation.message.createSuccess'),
        duration: 5000,
        keepAliveOnHover: true,
      },
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
    meta: {
      toastOnSuccess: {
        title: $t('common.status.success'),
        content: $t('domain.invitation.message.updateSuccess'),
        duration: 5000,
        keepAliveOnHover: true,
      },
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
    meta: {
      toastOnSuccess: {
        title: $t('common.status.success'),
        content: $t('domain.invitation.message.deleteSuccess'),
        duration: 5000,
        keepAliveOnHover: true,
      },
    },
  })
}
