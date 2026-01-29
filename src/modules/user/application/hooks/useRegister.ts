import type { RegisterRequest, RegisterResponse } from '@/modules/user/application/models'
import { useMutation } from '@tanstack/vue-query'
import { userService } from '@/modules/user/application/service'

/**
 * 注册
 * @return {UseMutationReturnType<RegisterResponse,unknown,RegisterRequest,unknown>}
 */
export function useRegister() {
  return useMutation<
    RegisterResponse,
    unknown,
    RegisterRequest,
    unknown
  >({
    mutationKey: ['register'],
    mutationFn: (data: RegisterRequest) => userService.register(data),
  })
}
