import { useMutation } from '@tanstack/vue-query'
import type { SignInResponseComplete, TotpVerifyForm } from '../models'
import { totpService } from '../totp-service'
import { useAccountStore } from '../stores/useAccountStore'
import router from '@/router'

export interface TotpVerifyMutate {
  twoFactorToken: string
  code: string
  rememberMe: boolean
  rememberDevice: boolean
  redirect?: string
}

export function useTotpVerify() {
  return useMutation({
    mutationFn: (variables: TotpVerifyMutate) =>
      totpService.verify({
        twoFactorToken: variables.twoFactorToken,
        code: variables.code,
        rememberMe: variables.rememberMe,
        rememberDevice: variables.rememberDevice,
      } satisfies TotpVerifyForm),
    onSuccess: (data, variables) => {
      if (data.requireTwoFactor) {
        return
      }
      useAccountStore().login(data as SignInResponseComplete)
      router.push(variables.redirect || { name: 'dashboard' })
    },
  })
}
