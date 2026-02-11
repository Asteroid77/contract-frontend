import type {
  ChangePasswordRequestDTO,
  ForgetPasswordRequestDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
  RevokeDeviceSessionsRequestDTO,
  TotpDisableRequestDTO,
  TotpEnableRequestDTO,
  TotpVerifyRequestDTO,
  UserAdditionalInfoRequestDTO,
} from '../domain/dto'
import type {
  RevokeDeviceSessionsResponseDto,
  TotpSetupVo,
  TotpStatusVo,
  UserAdditionalInfoVo,
  UserDeviceSessionVo,
  UserInfoVo,
  UserPageVo,
} from '../domain/types'
import type {
  ChangePasswordForm,
  PasswordRecoveryForm,
  RegisterForm,
  RegisterResponse,
  RevokeDeviceSessionsForm,
  RevokeDeviceSessionsResult,
  SignInForm,
  SignInResponse,
  TotpDisableForm,
  TotpEnableForm,
  TotpSetupResult,
  TotpStatus,
  TotpVerifyForm,
  UserAdditionalInfo,
  UserAdditionalInfoForm,
  UserDeviceSession,
  UserInfo,
  UserPageItem,
} from './models'
import type { ApprovalInstance } from '@/modules/approval/domain/types'

export const toDomainLoginRequest = (view: SignInForm): LoginRequestDTO => ({
  phone: view.phone,
  password: view.password,
  captcha: view.captcha,
  captchaKey: view.captchaKey,
  remember: view.remember,
})

export const toDomainRegisterRequest = (view: RegisterForm): RegisterRequestDTO => ({
  phone: view.phone,
  password: view.password,
  code: view.code,
  bizId: view.bizId,
})

export const toDomainPasswordRecoveryRequest = (
  view: PasswordRecoveryForm,
): ForgetPasswordRequestDTO => ({
  phone: view.phone,
  password: view.password,
  code: view.code,
  bizId: view.bizId,
})

export const toDomainChangePasswordRequest = (
  view: ChangePasswordForm,
): ChangePasswordRequestDTO => ({
  oldPassword: view.oldPassword,
  newPassword: view.newPassword,
})

export const toDomainRevokeCurrentUserDevicesRequest = (
  view: RevokeDeviceSessionsForm,
): RevokeDeviceSessionsRequestDTO => ({
  deviceIds: view.deviceIds,
  allowCurrentDevice: view.allowCurrentDevice ?? false,
})

export const toDomainAdditionalInfoRequest = (
  view: UserAdditionalInfoForm,
): UserAdditionalInfoRequestDTO => ({
  id: view.id,
  registerType: view.registerType,
  name: view.name,
  userId: view.userId,
  bankName: view.bankName,
  bankAccount: view.bankAccount,
  referrer: view.referrer,
  companyAddress: view.companyAddress,
  pca: view.pca,
  contactPerson: view.contactPerson,
  contactPersonPhone: view.contactPersonPhone,
  identity: view.identity,
})

const toViewUserInfo = (info: UserInfoVo): UserInfo => ({
  id: info.base.id,
  name: info.profile?.name ?? '',
  phone: info.base.phone,
  active: info.needProfile ? '0' : '1',
  isDeleted: info.base.isDeleted ? 1 : 0,
  platform: 'NATIVE',
})

export const toViewAdditionalInfo = (
  info: UserAdditionalInfoVo | null,
): UserAdditionalInfo | null => {
  if (!info) return null
  return {
    id: info.id,
    registerType: info.registerType,
    name: info.name,
    bankName: info.bankName,
    bankAccount: info.bankAccount,
    invitationCode: info.invitationCode ?? undefined,
    companyAddress: info.companyAddress ?? undefined,
    pca: info.pca,
    contactPerson: info.contactPerson ?? undefined,
    contactPersonPhone: info.contactPersonPhone ?? undefined,
    identity: info.identity,
    discriminator: info.discriminator,
    userId: info.userId,
    referrer: info.referrer ?? undefined,
    referrerName: info.inviterName ?? undefined,
    inviterName: info.inviterName ?? undefined,
    inviterDiscriminator: info.inviterDiscriminator ?? undefined,
    createdTime: info.createdTime,
    updatedTime: info.updatedTime,
  }
}

export const toViewSignInResponse = (info: UserInfoVo): SignInResponse => {
  if (info.requireTwoFactor) {
    return {
      requireTwoFactor: true,
      twoFactorToken: info.twoFactorToken ?? '',
    }
  }
  return {
    requireTwoFactor: false,
    user: toViewUserInfo(info),
    profile: toViewAdditionalInfo(info.profile),
    token: info.token,
    refreshToken: info.refreshToken,
    roleList: info.roleList,
    permissionList: info.permissionList,
    needProfile: info.needProfile,
  }
}

export const toViewRegisterResponse = (userId: number): RegisterResponse => ({
  userId,
})

export const toViewUserDeviceSession = (session: UserDeviceSessionVo): UserDeviceSession => ({
  deviceId: session.deviceId,
  clientIp: session.clientIp,
  userAgent: session.userAgent,
  lastActiveAt: session.lastActiveAt,
  currentDevice: session.currentDevice,
})

export const toViewRevokeDeviceSessionsResult = (
  result: RevokeDeviceSessionsResponseDto,
): RevokeDeviceSessionsResult => ({
  revokedCount: result.revokedCount,
  skippedCurrentDeviceCount: result.skippedCurrentDeviceCount,
})

export const toViewUserPage = (row: UserPageVo): UserPageItem => ({
  id: row.id,
  phone: row.phone,
  deleted: row.deleted,
  createdAt: row.createdAt,
  deletedAt: row.deletedAt ?? null,
  name: row.name,
  registerType: row.registerType,
  discriminator: row.discriminator,
  platform: row.platform,
})

const toViewApprovalInstance = (
  instance: ApprovalInstance<Record<string, unknown>>,
): ApprovalInstance<Record<string, unknown>> => ({
  ...instance,
  approvalData: instance.approvalData,
  sourceData: instance.sourceData,
})

export const toViewAdditionalInfoApproval = (
  instance: ApprovalInstance<Record<string, unknown>>,
): ApprovalInstance<Record<string, unknown>> => toViewApprovalInstance(instance)

// --- TOTP Mappers ---

export const toDomainTotpVerifyRequest = (
  view: TotpVerifyForm,
): TotpVerifyRequestDTO => ({
  twoFactorToken: view.twoFactorToken,
  code: view.code,
  rememberMe: view.rememberMe,
})

export const toDomainTotpEnableRequest = (
  view: TotpEnableForm,
): TotpEnableRequestDTO => ({
  code: view.code,
})

export const toDomainTotpDisableRequest = (
  view: TotpDisableForm,
): TotpDisableRequestDTO => ({
  password: view.password,
})

export const toViewTotpStatus = (vo: TotpStatusVo): TotpStatus => ({
  enabled: vo.enabled,
})

export const toViewTotpSetup = (vo: TotpSetupVo): TotpSetupResult => ({
  secret: vo.secret,
  qrCodeUri: vo.qrCodeUri,
  backupCodes: [...vo.backupCodes],
})
