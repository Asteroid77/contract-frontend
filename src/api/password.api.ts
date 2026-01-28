import { useRequest } from '@/hooks/request/useRequest.ts'
import type { PasswordRecoveryRequest, PasswordRecoveryResponse } from '@/api/types/password'
import type { ServerResponse } from '@/types/request'

export const PASSWORD_API_ENDPOINT = {
  RECOVERY_BY_SMS: '/user/password/recovery',
}
export const passwordApi = {
  recoveryBySMS: (data: PasswordRecoveryRequest) => {
    return useRequest<ServerResponse<PasswordRecoveryResponse>, PasswordRecoveryRequest>({
      method: 'POST',
      url: PASSWORD_API_ENDPOINT.RECOVERY_BY_SMS,
      data,
    })
  },
}
