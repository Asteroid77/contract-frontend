import { useRequest } from '@/hooks/request/useRequest.ts'
import type { PasswordRecoveryRequest, PasswordRecoveryResponse } from '@/api/types/password'

export const PASSWORD_API_ENDPOINT = {
  RECOVERY_BY_SMS: '/user/password/recovery',
}
export const passwordApi = {
  recoveryBySMS: (data: PasswordRecoveryRequest) => {
    return useRequest<PasswordRecoveryResponse, PasswordRecoveryRequest>({
      method: 'POST',
      url: PASSWORD_API_ENDPOINT.RECOVERY_BY_SMS,
      data,
    })
  },
}
