import { message } from '@/_utils/discrete_naive_api'
import { $t } from '@/_utils/i18n'
import type { PasswordRecoveryForm } from '@/modules/user/application/models'
import { useMutation } from '@tanstack/vue-query'
import { userService } from '@/modules/user/application/service'
import router from '@/router'

export function usePasswordRecovery() {
  return useMutation({
    mutationFn: (data: PasswordRecoveryForm) => userService.passwordRecovery(data),
    onSuccess: () => {
      message.success($t('layout.profile.security.changePassword.success'))
      router.push({ name: 'login' })
    },
  })
}
