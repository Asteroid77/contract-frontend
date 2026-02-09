import { useMutation } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import type { ChangePasswordForm } from '@/modules/user/application/models'
import { userService } from '@/modules/user/application/service'

export function useChangePassword() {
  return useMutation<boolean, AxiosError<unknown>, ChangePasswordForm>({
    mutationFn: (data) => userService.changePassword(data),
  })
}
