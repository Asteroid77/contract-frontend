import type { SignInForm, SignInResponse, SignInResponseComplete } from '@/modules/user/application/models'
import { useMutation } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { userService } from '@/modules/user/application/service'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore.ts'
import router from '@/router'
import type { RouteLocationRaw } from 'vue-router'

export type SignInMutate = { redirect?: RouteLocationRaw } & (
  | {
      mode: 'local'
      data: SignInForm
    }
  | { mode: 'oauth2'; token: string; refreshToken?: string; redirect?: RouteLocationRaw }
)

export function useLogin() {
  return useMutation<SignInResponse, AxiosError<unknown>, SignInMutate, undefined>({
    mutationFn: (signInMutate: SignInMutate) =>
      signInMutate.mode === 'local'
        ? userService.login(signInMutate.data)
        : userService.getUserInfoByToken(signInMutate.token),
    onSuccess: async (data: SignInResponse, variable: SignInMutate) => {
      if (data.requireTwoFactor) {
        router.push({
          name: 'two-factor-verify',
          query: {
            token: data.twoFactorToken,
            redirect: typeof variable.redirect === 'string'
              ? variable.redirect
              : undefined,
          },
        })
        return
      }

      const complete = data as SignInResponseComplete
      // OAuth2 回调 URL 中的 refreshToken 优先于接口返回值
      if (variable.mode === 'oauth2' && variable.refreshToken) {
        complete.refreshToken = variable.refreshToken
      }
      useAccountStore().login(complete)
      router.push(variable.redirect || { name: 'dashboard' })
    },
  })
}
