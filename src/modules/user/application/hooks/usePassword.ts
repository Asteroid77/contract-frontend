import { userService } from '@/modules/user/application/service'
import { useMutation } from '@tanstack/vue-query'
import type { PasswordRecoveryRequest } from '@/modules/user/application/models'

export const usePassword = () => {
  return {
    recoveryBySMS,
  }
}

function recoveryBySMS() {
  return useMutation<
    boolean,
    unknown,
    PasswordRecoveryRequest,
    PasswordRecoveryRequest
  >({
    mutationKey: ['password', 'recovery', 'sms'],
    mutationFn: (data: PasswordRecoveryRequest) => userService.passwordRecovery(data),
  })
}
