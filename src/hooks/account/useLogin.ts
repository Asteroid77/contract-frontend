import type { SignInRequest, SignInResponse } from '@/types/account'
import { useMutation } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import type { ServerResponse } from '@/types/request'
import { userApi } from '@/api/user.api.ts'
import { useAccountStore } from '@/stores/useAccountStore.ts'
import router from '@/router'
import type { RouteLocationRaw } from 'vue-router'

export type SignInMutate = { redirect?: RouteLocationRaw } & (
  | {
      mode: 'local'
      data: SignInRequest
    }
  | { mode: 'oauth2'; token: string; redirect?: RouteLocationRaw }
)

export function useLogin() {
  return useMutation<
    ServerResponse<SignInResponse>,
    AxiosError<ServerResponse<unknown>>,
    SignInMutate,
    undefined
  >({
    mutationFn: (signInMutate: SignInMutate) =>
      signInMutate.mode === 'local'
        ? userApi.login(signInMutate.data)
        : userApi.getUserInfoByToken(signInMutate.token),
    onSuccess: async (data: ServerResponse<SignInResponse>, variable: SignInMutate) => {
      useAccountStore().login(data.data)
      router.push(variable.redirect || { name: 'dashboard' })
    },
  })
}
