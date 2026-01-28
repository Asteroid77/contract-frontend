import { userApi } from '@/api/user.api'
import type { SignInResponse } from '@/types/account'
import type { ServerResponse } from '@/types/request'
import { useQuery } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'

export const userKeys = {
  ALL: ['user'],
  INFO: (token: string) => ['user', 'info', token],
}
/**
 * 加载用户数据hook
 * @param accessToken token
 * @returns UseQueryReturnType<SignInResponse, AxiosError<ServerResponse<unknown>, any>>
 */
export function useLoadUserInfo(accessToken: string) {
  return useQuery<
    ServerResponse<SignInResponse>,
    AxiosError<ServerResponse<unknown>>,
    SignInResponse
  >({
    queryKey: userKeys.INFO(accessToken),
    queryFn: () => userApi.getUserInfoByToken(accessToken),
  })
}
