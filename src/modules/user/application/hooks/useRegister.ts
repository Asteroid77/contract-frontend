import type { RegisterForm } from '@/modules/user/application/models'
import { useMutation } from '@tanstack/vue-query'
import { userService } from '@/modules/user/application/service'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore.ts'
import router from '@/router'
import { $t } from '@/_utils/i18n'

/**
 * 注册
 * @return {UseMutationReturnType<RegisterResponse,unknown,RegisterRequest,unknown>}
 */
export function useRegister() {
  return useMutation({
    mutationKey: ['register'],
    mutationFn: (data: RegisterForm) => userService.register(data),
    onSuccess: (data) => {
      useAccountStore().login({
        requireTwoFactor: false,
        user: {
          id: data.userId,
          name: data.name || '',
          phone: data.phone || '',
          active: '1',
          isDeleted: 0,
          platform: 'NATIVE',
        },
        profile: null,
        token: '', // 注册后无 token，需重新登录或自动登录逻辑
        permissionList: [],
        roleList: [],
      })
      router.push({ name: 'login' })
    },
    meta: {
      toastOnSuccess: {
        title: $t('common.status.success'),
        content: $t('auth.register.success'),
        duration: 5000,
        keepAliveOnHover: true,
      },
    },
  })
}
