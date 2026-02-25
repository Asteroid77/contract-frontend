import { describe, expect, it, vi } from 'vitest'
import { UserService } from '@/modules/user/application/service'
import type { IUserRepository } from '@/modules/user/domain/repositories'
import type { SignInResponse, SignInResponseComplete } from '@/modules/user/application/models'

const createRepoMock = () => ({
  login: vi.fn(),
  register: vi.fn(),
  getCurrentUserInfo: vi.fn(),
  getUserInfoById: vi.fn(),
  exchangeOAuth2Code: vi.fn(),
  changePassword: vi.fn(),
  deleteUser: vi.fn(),
  listCurrentUserDevices: vi.fn(),
  revokeCurrentUserDevices: vi.fn(),
  additionalInfoRequest: vi.fn(),
  getUserPage: vi.fn(),
  passwordRecovery: vi.fn(),
})

const createService = () => {
  const repo = createRepoMock()
  const service = new UserService(repo as unknown as IUserRepository)

  return { repo, service }
}

const expectCompleteSignIn = (response: SignInResponse): SignInResponseComplete => {
  if (response.requireTwoFactor) {
    throw new Error('Expected completed sign-in response in this test')
  }

  return response
}

describe('UserService', () => {
  it('maps login response with refreshToken', async () => {
    const { repo, service } = createService()

    repo.login.mockResolvedValue({
      base: {
        id: 1,
        phone: '13800000000',
        isDeleted: false,
      },
      profile: null,
      token: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 7200,
      roleList: [],
      permissionList: [],
      needProfile: false,
      requireTwoFactor: false,
      twoFactorToken: null,
    })

    const result = await service.login({
      phone: '13800000000',
      password: 'pwd',
      captcha: '1234',
      captchaKey: 'captcha-key',
      remember: true,
    })

    expect(repo.login).toHaveBeenCalledWith({
      phone: '13800000000',
      password: 'pwd',
      captcha: '1234',
      captchaKey: 'captcha-key',
      rememberMe: true,
    })
    const completeResult = expectCompleteSignIn(result)
    expect(completeResult.token).toBe('access-token')
    expect(completeResult.refreshToken).toBe('refresh-token')
    expect(completeResult.expiresIn).toBe(7200)
    expect(completeResult.user.active).toBe('1')
  })

  it('maps register/getCurrentUserInfo/changePassword/passwordRecovery', async () => {
    const { repo, service } = createService()

    repo.register.mockResolvedValue(66)
    repo.getCurrentUserInfo.mockResolvedValue({
      base: {
        id: 1,
        phone: '13800000000',
        isDeleted: false,
      },
      profile: null,
      token: 'access-token-2',
      refreshToken: 'refresh-token-2',
      expiresIn: 1800,
      roleList: [],
      permissionList: [],
      needProfile: true,
      requireTwoFactor: false,
      twoFactorToken: null,
    })
    repo.changePassword.mockResolvedValue(true)
    repo.passwordRecovery.mockResolvedValue(true)

    await expect(
      service.register({
        phone: '13800000000',
        password: 'pwd',
        code: '6666',
        bizId: 'biz-id',
      }),
    ).resolves.toEqual({ userId: 66 })

    await expect(service.getCurrentUserInfo('access-token-2')).resolves.toEqual(
      expect.objectContaining({
        token: 'access-token-2',
        refreshToken: 'refresh-token-2',
        expiresIn: 1800,
        user: expect.objectContaining({ active: '0' }),
      }),
    )

    await expect(
      service.changePassword({
        oldPassword: 'old',
        newPassword: 'new',
      }),
    ).resolves.toBe(true)

    await expect(
      service.passwordRecovery({
        phone: '13800000000',
        password: 'new-pwd',
        code: '7777',
        bizId: 'biz-id-2',
      }),
    ).resolves.toBe(true)

    expect(repo.changePassword).toHaveBeenCalledWith({
      oldPassword: 'old',
      newPassword: 'new',
    })
    expect(repo.passwordRecovery).toHaveBeenCalledWith({
      phone: '13800000000',
      password: 'new-pwd',
      code: '7777',
      bizId: 'biz-id-2',
    })
  })

  it('delegates exchangeOAuth2Code to repository with authCode payload', async () => {
    const { repo, service } = createService()

    repo.exchangeOAuth2Code.mockResolvedValue({
      requireTwoFactor: false,
      accessToken: 'oauth-access-token',
      refreshToken: 'oauth-refresh-token',
      expiresIn: 900,
      twoFactorToken: null,
    })

    const result = await service.exchangeOAuth2Code('oauth-auth-code')

    expect(repo.exchangeOAuth2Code).toHaveBeenCalledWith({ authCode: 'oauth-auth-code' })
    expect(result).toEqual({
      requireTwoFactor: false,
      accessToken: 'oauth-access-token',
      refreshToken: 'oauth-refresh-token',
      expiresIn: 900,
      twoFactorToken: null,
    })
  })

  it('maps device list and revoke result', async () => {
    const { repo, service } = createService()

    repo.listCurrentUserDevices.mockResolvedValue([
      {
        deviceId: 'device-a',
        clientIp: '10.0.0.1',
        userAgent: 'UA-1',
        lastActiveAt: '2026-02-09T12:00:00+08:00',
        currentDevice: true,
      },
    ])

    repo.revokeCurrentUserDevices.mockResolvedValue({
      revokedCount: 3,
      skippedCurrentDeviceCount: 1,
    })

    const list = await service.listCurrentUserDevices()
    const revoke = await service.revokeCurrentUserDevices({
      deviceIds: ['device-a', 'device-b'],
    })

    expect(repo.listCurrentUserDevices).toHaveBeenCalledTimes(1)
    expect(list).toEqual([
      {
        deviceId: 'device-a',
        clientIp: '10.0.0.1',
        userAgent: 'UA-1',
        lastActiveAt: '2026-02-09T12:00:00+08:00',
        currentDevice: true,
      },
    ])

    expect(repo.revokeCurrentUserDevices).toHaveBeenCalledWith({
      deviceIds: ['device-a', 'device-b'],
      allowCurrentDevice: false,
    })
    expect(revoke).toEqual({
      revokedCount: 3,
      skippedCurrentDeviceCount: 1,
    })
  })

  it('maps additionalInfoRequest input dto and output approval payload/sourceData', async () => {
    const { repo, service } = createService()

    repo.additionalInfoRequest.mockResolvedValue({
      id: 101,
      approvalData: {
        id: 9,
        registerType: 1,
        name: '张三公司',
        bankName: '招商银行',
        bankAccount: '622202*********',
        invitationCode: null,
        companyAddress: null,
        pca: '110000,110100,110101',
        contactPerson: null,
        contactPersonPhone: null,
        identity: '91110108MA01XXXXXX',
        discriminator: 1001,
        userId: 66,
        referrer: null,
        inviterName: '李四',
        inviterDiscriminator: null,
        createdTime: '2026-02-09T10:00:00+08:00',
        updatedTime: '2026-02-09T10:30:00+08:00',
      },
      sourceData: {
        id: 8,
        registerType: 1,
        name: '历史公司',
        bankName: '建设银行',
        bankAccount: '621700*********',
        invitationCode: null,
        companyAddress: null,
        pca: '310000,310100,310101',
        contactPerson: null,
        contactPersonPhone: null,
        identity: '91110108MA01YYYYYY',
        discriminator: 1002,
        userId: 66,
        referrer: null,
        inviterName: '王五',
        inviterDiscriminator: null,
        createdTime: '2026-02-01T10:00:00+08:00',
        updatedTime: '2026-02-01T10:30:00+08:00',
      },
    })

    const result = await service.additionalInfoRequest({
      id: 9,
      registerType: 1,
      name: '张三公司',
      userId: 66,
      bankName: '招商银行',
      bankAccount: '622202*********',
      invitationCode: 'INVITE-CODE',
      companyAddress: '北京海淀',
      pca: '110000,110100,110101',
      contactPerson: '张三',
      contactPersonPhone: '13800000000',
      identity: '91110108MA01XXXXXX',
      referrer: 1000,
    })

    expect(repo.additionalInfoRequest).toHaveBeenCalledWith({
      id: 9,
      registerType: 1,
      name: '张三公司',
      userId: 66,
      bankName: '招商银行',
      bankAccount: '622202*********',
      companyAddress: '北京海淀',
      pca: '110000,110100,110101',
      contactPerson: '张三',
      contactPersonPhone: '13800000000',
      identity: '91110108MA01XXXXXX',
      referrer: 1000,
    })

    expect(result.id).toBe(101)
    expect(result.approvalData.name).toBe('张三公司')
    expect(result.approvalData.referrerName).toBe('李四')
    expect(result.approvalData.invitationCode).toBeUndefined()
    expect(result.sourceData?.name).toBe('历史公司')
    expect(result.sourceData?.referrerName).toBe('王五')
  })

  it('maps user page records with adapter', async () => {
    const { repo, service } = createService()

    repo.getUserPage.mockResolvedValue({
      page: 1,
      size: 10,
      total: 1,
      records: [
        {
          id: 100,
          phone: '13800000000',
          deleted: false,
          totpEnabled: false,
          createdAt: '2026-02-09T10:00:00+08:00',
          deletedAt: null,
          name: '张三',
          registerType: 1,
          discriminator: 9527,
          platform: 'NATIVE',
        },
      ],
    })

    const result = await service.getUserPage({
      page: 1,
      size: 10,
      query: {
        name: {
          condition: 'like',
          value: '张',
        },
      },
    })

    expect(repo.getUserPage).toHaveBeenCalledTimes(1)

    const pageArg = repo.getUserPage.mock.calls[0][0]

    expect(pageArg).toEqual(
      expect.objectContaining({
        page: 1,
        size: 10,
      }),
    )
    expect(pageArg.query).toEqual(
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            value: '张',
          }),
        ]),
      }),
    )

    expect(result.records[0]).toEqual({
      id: 100,
      phone: '13800000000',
      deleted: false,
      totpEnabled: false,
      createdAt: '2026-02-09T10:00:00+08:00',
      deletedAt: null,
      name: '张三',
      registerType: 1,
      discriminator: 9527,
      platform: 'NATIVE',
    })
  })

  it('getUserInfoById maps profile to additional info and deleteUser delegates repository', async () => {
    const { repo, service } = createService()

    repo.getUserInfoById.mockResolvedValue({
      base: {
        id: 2,
        phone: '13800000001',
        isDeleted: false,
      },
      profile: {
        id: 19,
        registerType: 1,
        name: '测试企业',
        bankName: '工商银行',
        bankAccount: '6222000',
        invitationCode: null,
        companyAddress: null,
        pca: '110000,110100,110101',
        contactPerson: null,
        contactPersonPhone: null,
        identity: '91110108MA01ZZZZZZ',
        discriminator: 2001,
        userId: 2,
        referrer: null,
        inviterName: null,
        inviterDiscriminator: null,
        createdTime: '2026-02-10T10:00:00+08:00',
        updatedTime: '2026-02-10T10:10:00+08:00',
      },
      token: 'token-2',
      roleList: [],
      permissionList: [],
      needProfile: false,
      requireTwoFactor: false,
      twoFactorToken: null,
    })
    repo.deleteUser.mockResolvedValue(true)

    const profile = await service.getUserInfoById(2)
    const deleted = await service.deleteUser(2)

    expect(repo.getUserInfoById).toHaveBeenCalledWith(2)
    expect(profile).toEqual(
      expect.objectContaining({
        id: 19,
        name: '测试企业',
        userId: 2,
      }),
    )
    expect(repo.deleteUser).toHaveBeenCalledWith(2)
    expect(deleted).toBe(true)
  })
})
