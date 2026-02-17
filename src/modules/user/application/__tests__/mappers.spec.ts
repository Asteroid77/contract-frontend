import { describe, expect, it } from 'vitest'
import {
  toDomainAdditionalInfoRequest,
  toDomainChangePasswordRequest,
  toDomainLoginRequest,
  toDomainPasswordRecoveryRequest,
  toDomainRegisterRequest,
  toDomainRevokeCurrentUserDevicesRequest,
  toDomainTotpVerifyRequest,
  toViewAdditionalInfo,
  toViewRevokeDeviceSessionsResult,
  toViewSignInResponse,
  toViewUserDeviceSession,
  toViewUserPage,
} from '@/modules/user/application/mappers'
import type { UserAdditionalInfoVo, UserInfoVo, UserPageVo } from '@/modules/user/domain/types'

const createUserInfoVo = (overrides?: Partial<UserInfoVo>): UserInfoVo => ({
  base: {
    id: 1,
    phone: '13800000000',
    isDeleted: false,
  },
  profile: null,
  token: 'access-token',
  refreshToken: 'refresh-token',
  roleList: [],
  permissionList: [],
  needProfile: false,
  ...overrides,
})

const createAdditionalInfoVo = (overrides?: Partial<UserAdditionalInfoVo>): UserAdditionalInfoVo => ({
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
  ...overrides,
})

const createUserPageVo = (overrides?: Partial<UserPageVo>): UserPageVo => ({
  id: 100,
  phone: '13800000000',
  deleted: false,
  createdAt: '2026-02-09T10:00:00+08:00',
  deletedAt: null,
  name: '张三',
  registerType: 1,
  discriminator: 9527,
  platform: 'NATIVE',
  ...overrides,
})

describe('user application mappers', () => {
  it('maps login/register/password-recovery/change-password form to domain dto', () => {
    expect(
      toDomainLoginRequest({
        phone: '13800000000',
        password: 'pwd',
        captcha: '1234',
        captchaKey: 'captcha-key',
        remember: true,
      }),
    ).toEqual({
      phone: '13800000000',
      password: 'pwd',
      captcha: '1234',
      captchaKey: 'captcha-key',
      rememberMe: true,
    })

    expect(
      toDomainRegisterRequest({
        phone: '13800000000',
        password: 'pwd',
        code: '6666',
        bizId: 'biz-id',
      }),
    ).toEqual({
      phone: '13800000000',
      password: 'pwd',
      code: '6666',
      bizId: 'biz-id',
    })

    expect(
      toDomainPasswordRecoveryRequest({
        phone: '13800000000',
        password: 'new-pwd',
        code: '7777',
        bizId: 'biz-id-2',
      }),
    ).toEqual({
      phone: '13800000000',
      password: 'new-pwd',
      code: '7777',
      bizId: 'biz-id-2',
    })

    expect(
      toDomainChangePasswordRequest({
        oldPassword: 'old',
        newPassword: 'new',
      }),
    ).toEqual({
      oldPassword: 'old',
      newPassword: 'new',
    })
  })

  it('maps additional-info form to domain dto', () => {
    expect(
      toDomainAdditionalInfoRequest({
        id: 9,
        registerType: 1,
        name: '张三公司',
        userId: 66,
        bankName: '招商银行',
        bankAccount: '622202*********',
        referrer: 1000,
        companyAddress: '北京海淀',
        pca: '110000,110100,110101',
        contactPerson: '张三',
        contactPersonPhone: '13800000000',
        identity: '91110108MA01XXXXXX',
      }),
    ).toEqual({
      id: 9,
      registerType: 1,
      name: '张三公司',
      userId: 66,
      bankName: '招商银行',
      bankAccount: '622202*********',
      referrer: 1000,
      companyAddress: '北京海淀',
      pca: '110000,110100,110101',
      contactPerson: '张三',
      contactPersonPhone: '13800000000',
      identity: '91110108MA01XXXXXX',
    })
  })

  it('maps totp verify form to domain dto', () => {
    expect(
      toDomainTotpVerifyRequest({
        twoFactorToken: '2fa-token',
        code: '123456',
        rememberMe: true,
        rememberDevice: false,
      }),
    ).toEqual({
      twoFactorToken: '2fa-token',
      code: '123456',
      rememberMe: true,
      rememberDevice: false,
    })
  })

  it('returns null when mapping null additional info', () => {
    expect(toViewAdditionalInfo(null)).toBeNull()
  })

  it('maps additional info nullable fields to undefined and keeps inviter mapping', () => {
    const result = toViewAdditionalInfo(createAdditionalInfoVo())

    expect(result).toEqual(
      expect.objectContaining({
        invitationCode: undefined,
        companyAddress: undefined,
        contactPerson: undefined,
        contactPersonPhone: undefined,
        referrer: undefined,
        referrerName: '李四',
        inviterName: '李四',
        inviterDiscriminator: undefined,
      }),
    )
  })

  it('maps sign-in response and derives active by needProfile', () => {
    const completedResult = toViewSignInResponse(
      createUserInfoVo({
        token: 'access-new',
        refreshToken: 'refresh-new',
        expiresIn: 7200,
        needProfile: false,
      }),
    )

    const uncompletedResult = toViewSignInResponse(
      createUserInfoVo({
        needProfile: true,
      }),
    )

    expect(completedResult.token).toBe('access-new')
    expect(completedResult.refreshToken).toBe('refresh-new')
    expect(completedResult.expiresIn).toBe(7200)
    expect(completedResult.user.active).toBe('1')
    expect(uncompletedResult.user.active).toBe('0')
  })

  it('maps revoke device request and defaults allowCurrentDevice=false', () => {
    expect(
      toDomainRevokeCurrentUserDevicesRequest({
        deviceIds: ['device-1', 'device-2'],
      }),
    ).toEqual({
      deviceIds: ['device-1', 'device-2'],
      allowCurrentDevice: false,
    })

    expect(
      toDomainRevokeCurrentUserDevicesRequest({
        deviceIds: ['device-3'],
        allowCurrentDevice: true,
      }),
    ).toEqual({
      deviceIds: ['device-3'],
      allowCurrentDevice: true,
    })
  })

  it('maps device session dto and revoke result dto', () => {
    expect(
      toViewUserDeviceSession({
        deviceId: 'device-1',
        clientIp: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        lastActiveAt: '2026-02-09T12:00:00+08:00',
        currentDevice: true,
      }),
    ).toEqual({
      deviceId: 'device-1',
      clientIp: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      lastActiveAt: '2026-02-09T12:00:00+08:00',
      currentDevice: true,
    })

    expect(
      toViewRevokeDeviceSessionsResult({
        revokedCount: 2,
        skippedCurrentDeviceCount: 1,
      }),
    ).toEqual({
      revokedCount: 2,
      skippedCurrentDeviceCount: 1,
    })
  })

  it('maps user page row', () => {
    expect(toViewUserPage(createUserPageVo())).toEqual({
      id: 100,
      phone: '13800000000',
      deleted: false,
      createdAt: '2026-02-09T10:00:00+08:00',
      deletedAt: null,
      name: '张三',
      registerType: 1,
      discriminator: 9527,
      platform: 'NATIVE',
    })
  })
})
