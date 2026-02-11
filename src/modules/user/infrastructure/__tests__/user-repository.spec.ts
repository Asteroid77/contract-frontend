import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { userRepository } from '@/modules/user/infrastructure/user-repository'
import { USER_ENDPOINTS } from '@/modules/user/infrastructure/user-endpoints'

vi.mock('@/modules/shared/infrastructure/useRequest', () => ({
  useRequest: vi.fn(),
}))

describe('userRepository contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('login forwards dto and returns response data', async () => {
    const payload = { token: 'access-token' }
    const dto = {
      phone: '13800000000',
      password: 'pwd',
      captcha: '1234',
      captchaKey: 'captcha-key',
      remember: true,
    }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await userRepository.login(dto)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: USER_ENDPOINTS.LOGIN,
      data: dto,
    })
    expect(result).toEqual(payload)
  })

  it('register forwards dto and returns response data', async () => {
    const payload = 99
    const dto = {
      phone: '13800000000',
      password: 'pwd',
      code: '6666',
      bizId: 'biz-1',
    }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await userRepository.register(dto)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: USER_ENDPOINTS.REGISTER,
      data: dto,
    })
    expect(result).toBe(payload)
  })

  it('getByToken concatenates token in url and returns response data', async () => {
    const payload = { token: 'new-token' }
    const token = 'abc-token'

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await userRepository.getByToken(token)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: `${USER_ENDPOINTS.GET_BY_TOKEN}${token}`,
    })
    expect(result).toEqual(payload)
  })

  it('changePassword forwards dto and returns response data', async () => {
    const payload = true
    const dto = {
      oldPassword: 'old',
      newPassword: 'new',
    }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await userRepository.changePassword(dto)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: USER_ENDPOINTS.PASSWORD_CHANGE,
      data: dto,
    })
    expect(result).toBe(true)
  })

  it('listCurrentUserDevices disables success notify and returns response data', async () => {
    const payload = [
      {
        deviceId: 'device-a',
        lastActiveAt: '2026-02-10T10:00:00+08:00',
        currentDevice: true,
      },
    ]

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await userRepository.listCurrentUserDevices()

    expect(useRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: USER_ENDPOINTS.DEVICES,
      notify: {
        success: false,
      },
    })
    expect(result).toEqual(payload)
  })

  it('revokeCurrentUserDevices forwards dto and returns response data', async () => {
    const payload = {
      revokedCount: 2,
      skippedCurrentDeviceCount: 1,
    }
    const dto = {
      deviceIds: ['device-a', 'device-b'],
      allowCurrentDevice: false,
    }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await userRepository.revokeCurrentUserDevices(dto)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: USER_ENDPOINTS.DEVICES_REVOKE,
      data: dto,
    })
    expect(result).toEqual(payload)
  })

  it('additionalInfoRequest forwards dto and returns response data', async () => {
    const payload = {
      id: 101,
      approvalData: {},
      sourceData: null,
    }
    const dto = {
      registerType: 1 as const,
      name: '测试公司',
      userId: 10,
      bankName: '招商银行',
      bankAccount: '6222',
      pca: '110000,110100,110101',
      identity: '91110108MA01XXXXXX',
    }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await userRepository.additionalInfoRequest(dto)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: USER_ENDPOINTS.ADDITIONAL_INFO_PUT,
      data: dto,
    })
    expect(result).toEqual(payload)
  })

  it('getUserPage forwards page request with silent success notify and returns response data', async () => {
    const payload = {
      records: [],
      total: 0,
    }
    const pageRequest = {
      page: 1,
      size: 20,
      query: {
        filters: [],
      },
    }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await userRepository.getUserPage(pageRequest as never)

    expect(useRequest).toHaveBeenCalledWith({
      url: USER_ENDPOINTS.PAGE,
      method: 'POST',
      data: pageRequest,
      notify: {
        success: false,
      },
    })
    expect(result).toEqual(payload)
  })

  it('passwordRecovery forwards dto and returns response data', async () => {
    const payload = true
    const dto = {
      phone: '13800000000',
      password: 'newPwd',
      code: '7777',
      bizId: 'biz-2',
    }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await userRepository.passwordRecovery(dto)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: USER_ENDPOINTS.PASSWORD_RECOVERY,
      data: dto,
    })
    expect(result).toBe(true)
  })
})
