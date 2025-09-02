import dexie from '@/_utils/dexie'
import { userApi } from '@/api/user.api'
import { useAccountStore } from '@/stores/useAccountStore'
import type { SignInResponse } from '@/types/account'
import { type Ref } from 'vue'
/**
 * 加载用户数据hook
 */
export async function useLoadUserInfo(loading: Ref<boolean>) {
  const accountStore = useAccountStore()
  const isAuth = accountStore.isAuth
  const accessToken: string | null = localStorage.getItem('ACCESS_TOKEN')
  if (!loading.value)
    if (accessToken && !isAuth) {
      loading.value = true
      try {
        const data: SignInResponse | undefined = await dexie.userinfo.get(accessToken)
        if (data) {
          accountStore.login(data)
        } else {
          const data: SignInResponse | undefined = await userApi.getUserInfoByToken(accessToken)
          if (data) accountStore.login(data)
          else accountStore.logout()
        }
      } finally {
        loading.value = false
      }
    }
}
