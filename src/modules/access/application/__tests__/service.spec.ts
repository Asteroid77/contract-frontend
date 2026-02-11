import { beforeEach, describe, expect, it, vi } from 'vitest'
import { accessService } from '@/modules/access/application/service'
import { accessRepository } from '@/modules/access/infrastructure/access-repository'
import { toDomainPageRequest } from '@/modules/shared/application/query/legacy-query-adapter'

vi.mock('@/modules/access/infrastructure/access-repository', () => ({
  accessRepository: {
    getRolePage: vi.fn(),
    editRole: vi.fn(),
    getRolesByUserId: vi.fn(),
    getPermissionPage: vi.fn(),
    getPermissionsByRoleId: vi.fn(),
    getAssignedUsersByRoleId: vi.fn(),
    assignRoleToUsers: vi.fn(),
  },
}))

vi.mock('@/modules/shared/application/query/legacy-query-adapter', () => ({
  toDomainPageRequest: vi.fn(),
}))

describe('accessService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getRolePage maps request by legacy adapter then calls repository', async () => {
    const mapped = {
      page: 1,
      size: 20,
      query: {
        filters: [],
      },
    }
    const pageRequest = {
      page: 1,
      size: 20,
      query: {
        name: {
          condition: 'like',
          value: '管理员',
        },
      },
    }
    const payload = { records: [] }

    vi.mocked(toDomainPageRequest).mockReturnValue(mapped as never)
    vi.mocked(accessRepository.getRolePage).mockResolvedValue(payload as never)

    const result = await accessService.getRolePage(pageRequest as never)

    expect(toDomainPageRequest).toHaveBeenCalledWith(pageRequest)
    expect(accessRepository.getRolePage).toHaveBeenCalledWith(mapped)
    expect(result).toEqual(payload)
  })

  it('getPermissionPage maps request by legacy adapter then calls repository', async () => {
    const mapped = {
      page: 2,
      size: 10,
      query: {
        filters: [],
      },
    }
    const pageRequest = {
      page: 2,
      size: 10,
      query: {
        description: {
          condition: 'like',
          value: '可见',
        },
      },
    }
    const payload = { records: [] }

    vi.mocked(toDomainPageRequest).mockReturnValue(mapped as never)
    vi.mocked(accessRepository.getPermissionPage).mockResolvedValue(payload as never)

    const result = await accessService.getPermissionPage(pageRequest as never)

    expect(toDomainPageRequest).toHaveBeenCalledWith(pageRequest)
    expect(accessRepository.getPermissionPage).toHaveBeenCalledWith(mapped)
    expect(result).toEqual(payload)
  })

  it('getPermissionsByRoleId maps nested page when provided', async () => {
    const mappedPage = {
      page: 3,
      size: 30,
      query: {
        filters: [],
      },
    }
    const payload = { records: [] }
    const request = {
      roleId: 9,
      page: {
        page: 3,
        size: 30,
        query: {
          name: {
            condition: 'like',
            value: '导出',
          },
        },
      },
    }

    vi.mocked(toDomainPageRequest).mockReturnValue(mappedPage as never)
    vi.mocked(accessRepository.getPermissionsByRoleId).mockResolvedValue(payload as never)

    const result = await accessService.getPermissionsByRoleId(request as never)

    expect(toDomainPageRequest).toHaveBeenCalledWith(request.page)
    expect(accessRepository.getPermissionsByRoleId).toHaveBeenCalledWith({
      roleId: 9,
      page: mappedPage,
    })
    expect(result).toEqual(payload)
  })

  it('getPermissionsByRoleId keeps page undefined when not provided', async () => {
    const payload = { records: [] }

    vi.mocked(accessRepository.getPermissionsByRoleId).mockResolvedValue(payload as never)

    const result = await accessService.getPermissionsByRoleId({ roleId: 10 })

    expect(toDomainPageRequest).not.toHaveBeenCalled()
    expect(accessRepository.getPermissionsByRoleId).toHaveBeenCalledWith({
      roleId: 10,
      page: undefined,
    })
    expect(result).toEqual(payload)
  })

  it('passes through editRole/getRolesByUserId/getAssignedUsersByRoleId/assignRoleToUsers', async () => {
    const roleForm = {
      id: 1,
      name: '管理员',
      description: '管理员角色',
      permissionIds: [1, 2],
    }
    const assignRequest = {
      roleId: 1,
      userIds: [66, 77],
    }

    vi.mocked(accessRepository.editRole).mockResolvedValue(1)
    vi.mocked(accessRepository.getRolesByUserId).mockResolvedValue([{ id: 1 }] as never)
    vi.mocked(accessRepository.getAssignedUsersByRoleId).mockResolvedValue([{ id: 66 }] as never)
    vi.mocked(accessRepository.assignRoleToUsers).mockResolvedValue(null)

    await expect(accessService.editRole(roleForm as never)).resolves.toBe(1)
    await expect(accessService.getRolesByUserId(66)).resolves.toEqual([{ id: 1 }])
    await expect(accessService.getAssignedUsersByRoleId(1)).resolves.toEqual([{ id: 66 }])
    await expect(accessService.assignRoleToUsers(assignRequest as never)).resolves.toBeNull()

    expect(accessRepository.editRole).toHaveBeenCalledWith(roleForm)
    expect(accessRepository.getRolesByUserId).toHaveBeenCalledWith(66)
    expect(accessRepository.getAssignedUsersByRoleId).toHaveBeenCalledWith(1)
    expect(accessRepository.assignRoleToUsers).toHaveBeenCalledWith(assignRequest)
  })
})
