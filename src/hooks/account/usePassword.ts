import { passwordApi } from '@/api/password.api.ts'
import { useMutation } from '@tanstack/vue-query'
import type { PasswordRecoveryRequest, PasswordRecoveryResponse } from '@/api/types/password'
import type { ServerResponse } from '@/types/request'

export const usePassword = () => {
  return {
    recoveryBySMS,
  }
}

function recoveryBySMS() {
  return useMutation<
    PasswordRecoveryResponse,
    ServerResponse<unknown>,
    PasswordRecoveryRequest,
    PasswordRecoveryRequest
  >({
    mutationKey: ['password', 'recovery', 'sms'],
    mutationFn: (data: PasswordRecoveryRequest) => passwordApi.recoveryBySMS(data),
  })
}
