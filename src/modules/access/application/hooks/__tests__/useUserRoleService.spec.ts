import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  useAssignRoleToUsers,
  useAssignedUsersByRole,
  userRoleKeys,
} from '@/modules/access/application/hooks/useUserRoleService'
import { accessService } from '@/modules/access/application/service'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import { roleKeys } from '@/modules/access/application/hooks/useRoleService'
import { userQueryKeys } from '@/modules/user/application/hooks/useUserPage'

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn((options) => options),
  useMutation: vi.fn((options) => options),
  useQueryClient: vi.fn(),
}))

vi.mock('@/modules/access/application/service', () => ({
  accessService: {
    getAssignedUsersByRoleId: vi.fn(),
    assignRoleToUsers: vi.fn(),
  },
}))

vi.mock('@/app/infrastructure/query/query-request-context', () => ({
  withQueryRequestContext: vi.fn((_queryKey, _ctx, runner) => runner()),
}))

vi.mock('@/modules/user/application/hooks/useUserPage', () => ({
  userQueryKeys: {
    lists: vi.fn(() => ['users', 'list']),
  },
}))

const queryClient = {
  invalidateQueries: vi.fn(),
}

type MockQueryOptions = {
  queryKey: { value: readonly unknown[] }
  enabled: { value: boolean }
  staleTime?: number
  gcTime?: number
  refetchOnWindowFocus?: boolean
  queryFn: (ctx: { queryKey: readonly unknown[] }) => unknown
}

type AssignRolePayload = {
  roleId: number
  userIds: number[]
}

type MockAssignRoleMutationOptions = {
  mutationFn: (payload: AssignRolePayload) => Promise<unknown>
  onSuccess: () => void
}

describe('useUserRoleService hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useQueryClient).mockReturnValue(queryClient as never)

    vi.mocked(accessService.getAssignedUsersByRoleId).mockResolvedValue([] as never)
    vi.mocked(accessService.assignRoleToUsers).mockResolvedValue(true as never)
  })

  it('defines stable user-role keys', () => {
    expect(userRoleKeys.all).toEqual(['userRole'])
    expect(userRoleKeys.assignedUsers()).toEqual(['userRole', 'assignedUsers'])
    expect(userRoleKeys.assignedUsersByRole(3)).toEqual([
      'userRole',
      'assignedUsers',
      { roleId: 3 },
    ])
    expect(userRoleKeys.assignedRoles()).toEqual(['userRole', 'assignedRoles'])
    expect(userRoleKeys.assignedRolesToUser(8)).toEqual([
      'userRole',
      'assignedRoles',
      { userId: 8 },
    ])
  })

  it('useAssignedUsersByRole handles missing roleId safely', async () => {
    const roleId = ref<number | undefined>(undefined)
    const enabled = ref(true)

    useAssignedUsersByRole(roleId, { enabled })
    const options = vi.mocked(useQuery).mock.calls[0][0] as unknown as MockQueryOptions

    expect(options.queryKey.value).toEqual(['userRole', 'assignedUsers', { roleId: null }])
    expect(options.enabled.value).toBe(false)

    expect(() =>
      options.queryFn({ queryKey: ['userRole', 'assignedUsers', { roleId: null }] }),
    ).toThrow('Role ID is required')

    roleId.value = 7
    expect(options.queryKey.value).toEqual(userRoleKeys.assignedUsersByRole(7))
    expect(options.enabled.value).toBe(true)
  })

  it('useAssignedUsersByRole delegates queryFn via request context', async () => {
    useAssignedUsersByRole(10, {
      staleTime: 111,
      gcTime: 222,
      refetchOnWindowFocus: true,
    })
    const options = vi.mocked(useQuery).mock.calls[0][0] as unknown as MockQueryOptions

    expect(options.queryKey.value).toEqual(userRoleKeys.assignedUsersByRole(10))
    expect(options.enabled.value).toBe(true)
    expect(options.staleTime).toBe(111)
    expect(options.gcTime).toBe(222)
    expect(options.refetchOnWindowFocus).toBe(true)

    await options.queryFn({ queryKey: options.queryKey.value })

    expect(withQueryRequestContext).toHaveBeenCalled()
    expect(accessService.getAssignedUsersByRoleId).toHaveBeenCalledWith(10)
  })

  it('useAssignRoleToUsers invalidates role and user list caches', async () => {
    useAssignRoleToUsers()
    const options = vi.mocked(useMutation).mock
      .calls[0][0] as unknown as MockAssignRoleMutationOptions

    const payload = {
      roleId: 3,
      userIds: [10, 11],
    }

    await options.mutationFn(payload)
    expect(accessService.assignRoleToUsers).toHaveBeenCalledWith(payload)

    options.onSuccess()
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: roleKeys.lists() })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: userQueryKeys.lists() })
  })
})
