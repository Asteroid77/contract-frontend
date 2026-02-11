import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { userKeys, useLoadUserInfo } from '@/modules/user/application/hooks/useLoadUserInfo'
import { userQueryKeys, useUserPage } from '@/modules/user/application/hooks/useUserPage'
import { useUserAdditionalInfoRequest } from '@/modules/user/application/hooks/useUserAdditionalInfoRequest'
import { userService } from '@/modules/user/application/service'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import { approvalInstanceKeys } from '@/modules/approval/application/hooks/useApprovalService'

const { keepPreviousDataMarker } = vi.hoisted(() => ({
  keepPreviousDataMarker: Symbol('keepPreviousData'),
}))

vi.mock('@tanstack/vue-query', () => ({
  keepPreviousData: keepPreviousDataMarker,
  useQuery: vi.fn((options) => options),
  useMutation: vi.fn((options) => options),
  useQueryClient: vi.fn(),
}))

vi.mock('@/modules/user/application/service', () => ({
  userService: {
    getUserInfoByToken: vi.fn(),
    getUserPage: vi.fn(),
    additionalInfoRequest: vi.fn(),
  },
}))

vi.mock('@/app/infrastructure/query/query-request-context', () => ({
  withQueryRequestContext: vi.fn((_queryKey, _ctx, runner) => runner()),
}))

vi.mock('@/modules/approval/application/hooks/useApprovalService', () => ({
  approvalInstanceKeys: {
    LATEST_ADDITIONAL_INFO_INSTANCE: ['approval', 'instance', 'additional_info'],
  },
}))

const queryClient = {
  invalidateQueries: vi.fn(),
}

describe('user query hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useQueryClient).mockReturnValue(queryClient as never)

    vi.mocked(userService.getUserInfoByToken).mockResolvedValue({ token: 'token-a' } as never)
    vi.mocked(userService.getUserPage).mockResolvedValue({
      records: [],
      total: 0,
      size: 10,
      current: 1,
    } as never)
    vi.mocked(userService.additionalInfoRequest).mockResolvedValue({
      id: 101,
      processName: '用户信息审批',
      status: 'pending',
    } as never)
  })

  it('defines stable user keys', () => {
    expect(userKeys.ALL).toEqual(['user'])
    expect(userKeys.INFO('abc')).toEqual(['user', 'info', 'abc'])

    expect(userQueryKeys.all).toEqual(['users'])
    expect(userQueryKeys.lists()).toEqual(['users', 'list'])
    expect(userQueryKeys.list({ page: 1 })).toEqual(['users', 'list', { page: 1 }])
  })

  it('useLoadUserInfo configures query and delegates queryFn through request context', async () => {
    useLoadUserInfo('token-1')
    const options = vi.mocked(useQuery).mock.calls[0][0] as any

    expect(options.queryKey).toEqual(userKeys.INFO('token-1'))

    await options.queryFn({ queryKey: userKeys.INFO('token-1') })

    expect(withQueryRequestContext).toHaveBeenCalled()
    expect(userService.getUserInfoByToken).toHaveBeenCalledWith('token-1')
  })

  it('useUserPage uses defaults and delegates queryFn', async () => {
    const request = {
      page: 2,
      size: 20,
      query: {
        name: {
          value: 'alice',
          condition: 'like' as const,
        },
      },
    }

    useUserPage(request)
    const options = vi.mocked(useQuery).mock.calls[0][0] as any

    expect(options.queryKey.value).toEqual(userQueryKeys.list(request))
    expect(options.placeholderData).toBe(keepPreviousData)
    expect(options.staleTime).toBe(5 * 60 * 1000)
    expect(options.gcTime).toBe(10 * 60 * 1000)
    expect(options.enabled).toBe(true)
    expect(options.refetchOnWindowFocus).toBe(false)

    await options.queryFn({ queryKey: options.queryKey.value })

    expect(withQueryRequestContext).toHaveBeenCalled()
    expect(userService.getUserPage).toHaveBeenCalledWith(request)
  })

  it('useUserPage respects override options', () => {
    const request = ref({ page: 1, size: 10 })
    const enabled = ref(false)

    useUserPage(request, {
      enabled,
      staleTime: 123,
      gcTime: 456,
      refetchOnWindowFocus: true,
    })
    const options = vi.mocked(useQuery).mock.calls[0][0] as any

    expect(options.queryKey.value).toEqual(userQueryKeys.list(request.value))
    expect(options.enabled).toBe(enabled)
    expect(options.staleTime).toBe(123)
    expect(options.gcTime).toBe(456)
    expect(options.refetchOnWindowFocus).toBe(true)
  })

  it('useUserAdditionalInfoRequest delegates mutation and invalidates related queries', async () => {
    const callback = vi.fn()

    useUserAdditionalInfoRequest(callback)
    const options = vi.mocked(useMutation).mock.calls[0][0] as any

    const payload = {
      registerType: 1,
      name: 'Alice',
      bankName: 'Bank',
      bankAccount: '123456',
      pca: 'Shanghai',
      identity: 'ID123',
    }

    await options.mutationFn(payload)
    expect(userService.additionalInfoRequest).toHaveBeenCalledWith(payload)
    expect(options.mutationKey).toEqual(['user', 'additional_info', 'put'])

    const response = {
      id: 999,
      processName: '用户信息审批',
      status: 'pending',
    }
    options.onSuccess(response)

    expect(callback).toHaveBeenCalledWith(response)
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE,
    })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: userQueryKeys.all,
    })
  })
})
