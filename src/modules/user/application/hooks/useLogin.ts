import type { SignInForm, SignInResponseComplete } from '@/modules/user/application/models'
import { useMutation } from '@tanstack/vue-query'
import { userService } from '@/modules/user/application/service'
import router from '@/router'
import type { RouteLocationRaw } from 'vue-router'
import { enablePostLoginEnhancements } from '@/app/plugins/post-login-enhancements'

export type SignInMutate = { redirect?: RouteLocationRaw } & (
  | {
      mode: 'local'
      data: SignInForm
    }
  | { mode: 'oauth2'; authCode: string; rememberMe: boolean; redirect?: RouteLocationRaw }
)

export function useLogin() {
  return useMutation({
    mutationFn: async (signInMutate: SignInMutate) => {
      if (signInMutate.mode === 'local') {
        return userService.login(signInMutate.data)
      }

      const exchangeResult = await userService.exchangeOAuth2Code(signInMutate.authCode)

      if (exchangeResult.requireTwoFactor) {
        if (!exchangeResult.twoFactorToken) {
          throw new Error('OAuth2 exchange result missing twoFactorToken')
        }

        return {
          requireTwoFactor: true,
          twoFactorToken: exchangeResult.twoFactorToken,
        }
      }

      if (!exchangeResult.accessToken) {
        throw new Error('OAuth2 exchange result missing accessToken')
      }

      const profile = await userService.getCurrentUserInfo(exchangeResult.accessToken)
      if (!profile.requireTwoFactor) {
        return {
          ...profile,
          refreshToken: profile.refreshToken ?? exchangeResult.refreshToken ?? undefined,
          expiresIn: profile.expiresIn ?? exchangeResult.expiresIn,
        }
      }
      return profile
    },
    onSuccess: async (data, variable) => {
      if (data.requireTwoFactor) {
        const rememberMe =
          variable.mode === 'local'
            ? String(Boolean(variable.data.remember))
            : String(Boolean(variable.rememberMe))

        router.push({
          name: 'two-factor-verify',
          query: {
            token: data.twoFactorToken,
            rememberMe,
            redirect: typeof variable.redirect === 'string' ? variable.redirect : undefined,
          },
        })
        return
      }

      const complete = data as SignInResponseComplete
      const { useAccountStore } =
        await import('@/modules/user/application/stores/useAccountStore.ts')
      useAccountStore().login(complete)
      void enablePostLoginEnhancements().catch(() => undefined)
      router.push(variable.redirect || { name: 'dashboard' })
    },
  })
}
