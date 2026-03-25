import { approvalInstanceKeys } from '@/modules/approval/application/hooks/useApprovalService'
import { userService } from '@/modules/user/application/service'
import type { UserAdditionalInfo, UserAdditionalInfoForm } from '@/modules/user/application/models'
import type { ApprovalInstance } from '@/modules/approval/application/models'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { userQueryKeys } from './useUserPage'

export function useUserAdditionalInfoRequest(
  callback: (data: ApprovalInstance<UserAdditionalInfo>) => void,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UserAdditionalInfoForm) => userService.additionalInfoRequest(data),
    mutationKey: ['user', 'additional_info', 'put'] as const,
    onSuccess: (data) => {
      callback(data)
      queryClient.invalidateQueries({
        queryKey: approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE,
      })
      queryClient.invalidateQueries({
        queryKey: userQueryKeys.all,
      })
    },
  })
}
