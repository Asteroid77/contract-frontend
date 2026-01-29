import { approvalInstanceKeys } from '@/modules/approval/application/hooks/useApprovalService'
import { userService } from '@/modules/user/application/service'
import type { UserAdditionalInfo, UserAdditionalInfoRequest } from '@/modules/user/application/models'
import type { ApprovalInstance } from '@/modules/approval/application/models'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { userKeys } from './useLoadUserInfo'

export function useUserAdditionalInfoRequest(
  callback: (data: ApprovalInstance<UserAdditionalInfo>) => void,
) {
  const queryClient = useQueryClient()
  return useMutation<
    ApprovalInstance<UserAdditionalInfo>,
    AxiosError<unknown>,
    UserAdditionalInfoRequest,
    never
  >({
    mutationFn: (data: UserAdditionalInfoRequest) => userService.additionalInfoRequest(data),
    mutationKey: ['user', 'additional_info', 'put'],
    onSuccess: (data: ApprovalInstance<UserAdditionalInfo>) => {
      callback(data)
      queryClient.invalidateQueries({
        queryKey: approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE,
      })
      queryClient.invalidateQueries({
        queryKey: userKeys.ALL,
      })
    },
  })
}
