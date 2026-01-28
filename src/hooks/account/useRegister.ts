import type { RegisterRequest, RegisterResponse } from '@/types/account'
import { useMutation } from '@tanstack/vue-query'
import { userApi } from '@/api/user.api.ts'
import type { ServerResponse } from '@/types/request'

/**
 * 注册
 * @return {UseMutationReturnType<ServerResponse<RegisterResponse>,ServerResponse<unknown>,RegisterRequest,unknown>}
 */
export function useRegister() {
  return useMutation<
    ServerResponse<RegisterResponse>,
    ServerResponse<unknown>,
    RegisterRequest,
    unknown
  >({
    mutationKey: ['register'],
    mutationFn: (data: RegisterRequest) => userApi.register(data),
  })
}
