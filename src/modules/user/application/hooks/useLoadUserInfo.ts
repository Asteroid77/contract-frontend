import { userService } from '@/modules/user/application/service'
import type { SignInResponseComplete } from '@/modules/user/application/models'
import { useQuery } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'

export const userKeys = {
  ALL: ['user'],
  INFO: (token: string) => ['user', 'info', token],
}
/**
 * 加载用户数据hook
 * @param accessToken token
 * @returns UseQueryReturnType<SignInResponse, AxiosError<unknown>>
 */
export function useLoadUserInfo(accessToken: string) {
  return useQuery<SignInResponseComplete, AxiosError<unknown>, SignInResponseComplete>({
    queryKey: userKeys.INFO(accessToken),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => userService.getCurrentUserInfo()),
  })
}
