import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { accessRepository } from '@/modules/access/infrastructure/access-repository'

vi.mock('@/modules/shared/infrastructure/useRequest', () => ({
  useRequest: vi.fn(),
}))

describe('accessRepository contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getRolePage forwards page body with silent success notify and returns data', async () => {
    const payload = {
      records: [],
      total: 0,
    }
    const dto = {
      page: 1,
      size: 20,
      query: {
        filters: [],
      },
    }

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await accessRepository.getRolePage(dto as never)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/role/page',
      data: dto,
      notify: {
        success: false,
      },
      responseShape: 'data',

    })
    expect(result).toEqual(payload)
  })

  it('editRole forwards dto and returns data', async () => {
    const payload = 11
    const dto = {
      id: 11,
      roleName: '运营',
      roleKey: 'operator',
      permissionIds: [1, 2],
    }

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await accessRepository.editRole(dto as never)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/role/edit',
      data: dto,
      responseShape: 'data',

    })
    expect(result).toBe(payload)
  })

  it('getRolesByUserId sends params with silent success notify and returns data', async () => {
    const payload = [
      {
        id: 1,
        roleName: '管理员',
      },
    ]

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await accessRepository.getRolesByUserId(66)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: '/role/get',
      params: {
        userId: 66,
      },
      notify: {
        success: false,
      },
      responseShape: 'data',

    })
    expect(result).toEqual(payload)
  })

  it('getPermissionPage forwards page body with silent success notify and returns data', async () => {
    const payload = {
      records: [],
      total: 0,
    }
    const dto = {
      page: 1,
      size: 20,
      query: {
        filters: [],
      },
    }

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await accessRepository.getPermissionPage(dto as never)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/permission/page',
      data: dto,
      notify: {
        success: false,
      },
      responseShape: 'data',

    })
    expect(result).toEqual(payload)
  })

  it('getPermissionsByRoleId forwards dto with silent success notify and returns data', async () => {
    const payload = {
      records: [],
      total: 0,
    }
    const dto = {
      roleId: 9,
      page: 1,
      size: 20,
    }

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await accessRepository.getPermissionsByRoleId(dto as never)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/permission/role/page',
      data: dto,
      notify: {
        success: false,
      },
      responseShape: 'data',

    })
    expect(result).toEqual(payload)
  })

  it('getAssignedUsersByRoleId sends params with silent success notify and returns data', async () => {
    const payload = [
      {
        label: '张三',
        value: 1,
      },
    ]

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await accessRepository.getAssignedUsersByRoleId(9)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: '/user-role/assigned-users',
      params: {
        roleId: 9,
      },
      notify: {
        success: false,
      },
      responseShape: 'data',

    })
    expect(result).toEqual(payload)
  })

  it('assignRoleToUsers forwards dto and returns data', async () => {
    const payload = null
    const dto = {
      roleId: 9,
      userIds: [1, 2],
    }

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await accessRepository.assignRoleToUsers(dto as never)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/user-role/assign',
      data: dto,
      responseShape: 'data',

    })
    expect(result).toBeNull()
  })
})
