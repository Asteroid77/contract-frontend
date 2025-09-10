import { userApi } from '@/api/user.api'
import type { UserAdditionalInfo, UserAdditionalInfoRequest } from '@/types/account'
import type { ApprovalIsntance } from '@/api/types/approval'
import type { ServerResponse } from '@/types/request'
import { useMutation } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'

export function useUserAdditionalInfoRequest(
  callback: (data: ApprovalIsntance<UserAdditionalInfo>) => void,
) {
  return useMutation<
    ApprovalIsntance<UserAdditionalInfo>,
    AxiosError<ServerResponse<unknown>>,
    UserAdditionalInfoRequest,
    never
  >({
    mutationFn: (data: UserAdditionalInfoRequest) => userApi.additionalInfoRequest(data),
    mutationKey: ['user', 'additional_info', 'put'],
    onSuccess: (data: ApprovalIsntance<UserAdditionalInfo>) => {
      callback(data)
    },
  })
}
