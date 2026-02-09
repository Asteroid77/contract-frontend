import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import type {
  RevokeDeviceSessionsForm,
  RevokeDeviceSessionsResult,
  UserDeviceSession,
} from '@/modules/user/application/models'
import { userService } from '@/modules/user/application/service'

export const userDeviceKeys = {
  all: ['user', 'devices'] as const,
  list: () => [...userDeviceKeys.all, 'list'] as const,
}

export function useCurrentUserDevicesQuery() {
  return useQuery<UserDeviceSession[], AxiosError<unknown>, UserDeviceSession[]>({
    queryKey: userDeviceKeys.list(),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => userService.listCurrentUserDevices()),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useRevokeCurrentUserDevicesMutation() {
  const queryClient = useQueryClient()

  return useMutation<RevokeDeviceSessionsResult, AxiosError<unknown>, RevokeDeviceSessionsForm>({
    mutationFn: (data) => userService.revokeCurrentUserDevices(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userDeviceKeys.list() })
    },
  })
}
