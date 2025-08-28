import { useRequest } from '@/hooks/request/useRequest.ts'
import type {
  PasswordRecoveryRequest,
  PasswordRecoveryResponse,
} from '@/types/views/PasswordRecoveryView'

export const PASSWORD_API_ENDPOINT = {
  RECOVERY_BY_SMS: '/user/changePwdBySMS',
  RECOVERY_BY_OLD_PASSWORD: '/user/changePwd',
}
export const passwordService = {
  recoveryBySMS: (data: PasswordRecoveryRequest) => {
    return useRequest<PasswordRecoveryResponse, PasswordRecoveryRequest>({
      method: 'POST',
      url: PASSWORD_API_ENDPOINT.RECOVERY_BY_SMS,
      data,
    })
  },
}
