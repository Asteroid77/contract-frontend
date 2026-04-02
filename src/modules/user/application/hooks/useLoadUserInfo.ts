import { userService } from '@/modules/user/application/service'
import { useQuery } from '@tanstack/vue-query'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import { toValue, watch, type MaybeRefOrGetter } from 'vue'
import {
  getStoredAccessToken,
  getStoredRefreshToken,
} from '@/modules/access/application/token-manager'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'

export const userKeys = {
  ALL: ['user'] as const,
  INFO: ['user', 'info', 'current'] as const,
}
/**
 * 加载用户数据hook
 * @param accessToken token
 * @returns 当前用户信息查询结果
 */
export function useLoadUserInfo(accessToken: MaybeRefOrGetter<string | null | undefined>) {
  const accountStore = useAccountStore()

  const query = useQuery({
    queryKey: userKeys.INFO,
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => userService.getCurrentUserInfo()),
  })

  watch(
    () => query.data?.value,
    (profile) => {
      if (!profile) {
        return
      }

      const nextAccessToken =
        profile.token || getStoredAccessToken() || toValue(accessToken) || accountStore.token
      if (!nextAccessToken) {
        return
      }

      const nextRefreshToken =
        profile.refreshToken ??
        getStoredRefreshToken() ??
        accountStore.refreshToken ??
        undefined
      const accessTokenChanged = accountStore.token !== nextAccessToken
      const refreshTokenChanged = accountStore.refreshToken !== (nextRefreshToken ?? null)
      const hasExpiresIn = typeof profile.expiresIn === 'number'

      if (!accessTokenChanged && !refreshTokenChanged && !hasExpiresIn) {
        return
      }

      accountStore.updateTokens(nextAccessToken, nextRefreshToken, profile.expiresIn)
    },
    { immediate: true },
  )

  return query
}
