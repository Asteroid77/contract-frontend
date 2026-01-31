import type { PasswordRecoveryForm } from '@/modules/user/application/models'
import { useMutation } from '@tanstack/vue-query'
import { userService } from '@/modules/user/application/service'
import router from '@/router'

export function usePasswordRecovery() {
  return useMutation({
    mutationFn: (data: PasswordRecoveryForm) => userService.passwordRecovery(data),
    onSuccess: () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).$message.success('重置密码成功，请重新登录')
      router.push({ name: 'login' })
    },
  })
}
