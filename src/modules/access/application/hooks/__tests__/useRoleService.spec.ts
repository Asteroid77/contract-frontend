import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  roleKeys,
  useEditRole,
  useRolePage,
  useRolesByUserId,
} from '@/modules/access/application/hooks/useRoleService'
import { accessService } from '@/modules/access/application/service'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn((options) => options),
  useMutation: vi.fn((options) => options),
  useQueryClient: vi.fn(),
}))

vi.mock('@/modules/access/application/service', () => ({
  accessService: {
    getRolePage: vi.fn(),
    getRolesByUserId: vi.fn(),
    editRole: vi.fn(),
  },
}))

vi.mock('@/app/infrastructure/query/query-request-context', () => ({
  withQueryRequestContext: vi.fn((_queryKey, _ctx, runner) => runner()),
}))

const queryClient = {
  invalidateQueries: vi.fn(),
}

describe('useRoleService hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useQueryClient).mockReturnValue(queryClient as never)

    vi.mocked(accessService.getRolePage).mockResolvedValue({
      records: [],
      total: 0,
      size: 10,
      current: 1,
    } as never)
    vi.mocked(accessService.getRolesByUserId).mockResolvedValue([] as never)
    vi.mocked(accessService.editRole).mockResolvedValue(true as never)
  })

  it('defines stable role keys', () => {
    expect(roleKeys.all).toEqual(['role'])
    expect(roleKeys.lists()).toEqual(['role', 'list'])
    expect(roleKeys.list({ page: 1 })).toEqual(['role', 'list', { page: 1 }])
    expect(roleKeys.details()).toEqual(['role', 'detail'])
    expect(roleKeys.detail(10)).toEqual(['role', 'detail', 10])
    expect(roleKeys.userRoles(5)).toEqual(['role', 'user', 5])
  })

  it('useRolePage uses defaults and delegates queryFn', async () => {
    const params = {
      page: 1,
      size: 20,
    }

    useRolePage(params)
    const options = vi.mocked(useQuery).mock.calls[0][0] as any

    expect(options.queryKey.value).toEqual(roleKeys.list(params))
    expect(options.staleTime).toBe(5 * 60 * 1000)
    expect(options.gcTime).toBe(10 * 60 * 1000)
    expect(options.enabled).toBe(true)

    await options.queryFn({ queryKey: options.queryKey.value })

    expect(withQueryRequestContext).toHaveBeenCalled()
    expect(accessService.getRolePage).toHaveBeenCalledWith(params)
  })

  it('useRolesByUserId computes enabled by userId and option flag', async () => {
    const userId = ref(0)
    const enabled = ref(true)

    useRolesByUserId(userId, { enabled })
    const options = vi.mocked(useQuery).mock.calls[0][0] as any

    expect(options.queryKey.value).toEqual(roleKeys.userRoles(0))
    expect(options.enabled.value).toBe(false)

    userId.value = 6
    expect(options.queryKey.value).toEqual(roleKeys.userRoles(6))
    expect(options.enabled.value).toBe(true)

    enabled.value = false
    expect(options.enabled.value).toBe(false)

    await options.queryFn({ queryKey: options.queryKey.value })
    expect(accessService.getRolesByUserId).toHaveBeenCalledWith(6)
  })

  it('useEditRole invalidates list and user-role cache on success', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    useEditRole()
    const options = vi.mocked(useMutation).mock.calls[0][0] as any

    const payload = {
      id: 9,
      name: 'manager',
      description: 'desc',
      permissionIds: [1, 2],
    }

    await options.mutationFn(payload)
    expect(accessService.editRole).toHaveBeenCalledWith(payload)

    options.onSuccess({}, payload)
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: roleKeys.lists() })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: roleKeys.userRoles(9) })

    options.onError(new Error('failed'))
    expect(errorSpy).toHaveBeenCalled()

    errorSpy.mockRestore()
  })
})
