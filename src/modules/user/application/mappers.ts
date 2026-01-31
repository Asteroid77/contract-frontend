import type {
  LoginRequestDTO,
  RegisterRequestDTO,
  ForgetPasswordRequestDTO,
  UserAdditionalInfoRequestDTO,
} from '../domain/dto'
import type { UserAdditionalInfoVo, UserInfoVo, UserPageVo } from '../domain/types'
import type {
  PasswordRecoveryForm,
  RegisterForm,
  RegisterResponse,
  SignInForm,
  SignInResponse,
  UserAdditionalInfo,
  UserAdditionalInfoForm,
  UserInfo,
  UserPageItem,
} from './models'
import type { ApprovalInstance } from '@/modules/approval/domain/types'

export const toDomainLoginRequest = (view: SignInForm): LoginRequestDTO => ({
  phone: view.phone,
  password: view.password,
  captcha: view.captcha,
  captchaKey: view.captchaKey,
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

export const toViewSignInResponse = (info: UserInfoVo): SignInResponse => ({
  user: toViewUserInfo(info),
  profile: toViewAdditionalInfo(info.profile),
  token: info.token,
  roleList: info.roleList,
  permissionList: info.permissionList,
  needProfile: info.needProfile,
})

export const toViewRegisterResponse = (userId: number): RegisterResponse => ({
  userId,
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
