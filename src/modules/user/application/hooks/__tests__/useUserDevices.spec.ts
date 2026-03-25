import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  useCurrentUserDevicesQuery,
  useRevokeCurrentUserDevicesMutation,
  userDeviceKeys,
} from '@/modules/user/application/hooks/useUserDevices'
import { userService } from '@/modules/user/application/service'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn((options) => options),
  useMutation: vi.fn((options) => options),
  useQueryClient: vi.fn(),
}))

vi.mock('@/modules/user/application/service', () => ({
  userService: {
    listCurrentUserDevices: vi.fn(),
    revokeCurrentUserDevices: vi.fn(),
  },
}))

vi.mock('@/app/infrastructure/query/query-request-context', () => ({
  withQueryRequestContext: vi.fn((_queryKey, _ctx, runner) => runner()),
}))

const queryClient = {
  invalidateQueries: vi.fn(),
}

type MockDevicesQueryOptions = {
  queryKey: readonly unknown[]
  queryFn: (ctx: { queryKey: readonly unknown[] }) => Promise<unknown>
  staleTime: number
  refetchOnWindowFocus: boolean
}

type RevokePayload = {
  deviceIds: string[]
  allowCurrentDevice: boolean
}

type MockRevokeMutationOptions = {
  mutationFn: (payload: RevokePayload) => Promise<unknown>
  onSuccess: () => void
}

describe('useUserDevices hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useQueryClient).mockReturnValue(queryClient as never)
    vi.mocked(userService.listCurrentUserDevices).mockResolvedValue([
      {
        deviceId: 'device-a',
        clientIp: '10.0.0.1',
        userAgent: 'UA-1',
        lastActiveAt: '2026-02-10T10:00:00+08:00',
        currentDevice: true,
      },
    ] as never)
    vi.mocked(userService.revokeCurrentUserDevices).mockResolvedValue({
      revokedCount: 1,
      skippedCurrentDeviceCount: 0,
    } as never)
  })

  it('defines stable query keys', () => {
    expect(userDeviceKeys.all).toEqual(['user', 'devices'])
    expect(userDeviceKeys.list()).toEqual(['user', 'devices', 'list'])
  })

  it('useCurrentUserDevicesQuery configures query and delegates queryFn correctly', async () => {
    useCurrentUserDevicesQuery()
    const options = vi.mocked(useQuery).mock.calls[0][0] as unknown as MockDevicesQueryOptions

    expect(options.queryKey).toEqual(userDeviceKeys.list())
    expect(options.staleTime).toBe(30 * 1000)
    expect(options.refetchOnWindowFocus).toBe(false)

    await options.queryFn({ queryKey: userDeviceKeys.list() })

    expect(withQueryRequestContext).toHaveBeenCalled()
    expect(userService.listCurrentUserDevices).toHaveBeenCalledTimes(1)
  })

  it('useRevokeCurrentUserDevicesMutation delegates mutation and invalidates list on success', async () => {
    useRevokeCurrentUserDevicesMutation()
    const options = vi.mocked(useMutation).mock.calls[0][0] as MockRevokeMutationOptions

    const payload = {
      deviceIds: ['device-a', 'device-b'],
      allowCurrentDevice: false,
    }

    await options.mutationFn(payload)
    expect(userService.revokeCurrentUserDevices).toHaveBeenCalledWith(payload)

    options.onSuccess()
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: userDeviceKeys.list() })
  })
})
