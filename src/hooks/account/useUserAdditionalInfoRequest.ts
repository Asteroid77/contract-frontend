import { approvalInstanceKeys } from './../approval/useApprovalService'
import { userApi } from '@/api/user.api'
import type { UserAdditionalInfo, UserAdditionalInfoRequest } from '@/types/account'
import type { ApprovalInstance } from '@/components/approval/api/approval'
import type { ServerResponse } from '@/types/request'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { userKeys } from './useLoadUserInfo'

export function useUserAdditionalInfoRequest(
  callback: (data: ApprovalInstance<UserAdditionalInfo>) => void,
) {
  const queryClient = useQueryClient()
  return useMutation<
    ServerResponse<ApprovalInstance<UserAdditionalInfo>>,
    AxiosError<ServerResponse<unknown>>,
    UserAdditionalInfoRequest,
    never
  >({
    mutationFn: (data: UserAdditionalInfoRequest) => userApi.additionalInfoRequest(data),
    mutationKey: ['user', 'additional_info', 'put'],
    onSuccess: (data: ServerResponse<ApprovalInstance<UserAdditionalInfo>>) => {
      callback(data.data)
      queryClient.invalidateQueries({
        queryKey: approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE,
      })
      queryClient.invalidateQueries({
        queryKey: userKeys.ALL,
      })
    },
  })
}
