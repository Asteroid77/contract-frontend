import { useMutation } from '@tanstack/vue-query'
import type { ChangePasswordForm } from '@/modules/user/application/models'
import { userService } from '@/modules/user/application/service'

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordForm) => userService.changePassword(data),
  })
}
