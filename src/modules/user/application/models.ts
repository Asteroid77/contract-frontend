import type { BaseQuery, ConditionWrapper } from '@/modules/shared/application/request/types'
import type { Permission, RoleVo } from '@/modules/access/domain/types'

export type PlatformEnum = 'WECHAT' | 'GITHUB' | 'NATIVE'
export type RegisterType = 1 | 2
export type UserActive = 0 | 1

/**
 * 用户信息
 */
export interface UserInfo {
  id: number
  name: string
  phone: string
  active: '0' | '1'
  isDeleted: number
  platform: PlatformEnum
}

export interface UserAdditionalInfo {
  id?: number
  registerType: RegisterType
  name: string
  bankName: string
  bankAccount: string
  invitationCode?: string
  companyAddress?: string
  pca: string
  contactPerson?: string
  contactPersonPhone?: string
  identity: string
  discriminator: number
  userId: number
  referrer?: number
  referrerName?: string
  inviterName?: string
  inviterDiscriminator?: number
  createdTime: string
  updatedTime: string
}

export interface UserAdditionalInfoForm {
  id?: number
  registerType: RegisterType
  name: string
  userId?: number
  bankName: string
  bankAccount: string
  invitationCode?: string
  companyAddress?: string
  pca: string
  contactPerson?: string
  contactPersonPhone?: string
  identity: string
  referrer?: number
}

/**
 * 登录请求数据结构
 */
export interface SignInForm {
  phone: string
  password: string
  captchaKey: string
  captcha: string
  remember?: boolean
}

/**
 * 登录成功后返回数据结构
 */
export interface SignInResponse {
  user: UserInfo
  profile: UserAdditionalInfo | null
  token: string
  refreshToken?: string
  permissionList: Permission[]
  roleList: RoleVo[]
  needProfile?: boolean
}

export interface ChangePasswordForm {
  oldPassword: string
  newPassword: string
}

export interface UserDeviceSession {
  deviceId: string
  clientIp?: string
  userAgent?: string
  lastActiveAt: string
  currentDevice: boolean
}

export interface RevokeDeviceSessionsForm {
  deviceIds: string[]
  allowCurrentDevice?: boolean
}

export interface RevokeDeviceSessionsResult {
  revokedCount: number
  skippedCurrentDeviceCount: number
}

/**
 * 注册请求数据结构
 */
export interface RegisterForm {
  phone: string
  password: string
  code: string
  dbCheckPassword?: string
  bizId: string
}

/**
 * 注册成功后返回数据结构
 */
export interface RegisterResponse {
  userId: number
  name?: string
  phone?: string
  active?: UserActive
  isDeleted?: number
}

/**
 * 忘记密码请求数据结构
 */
export interface PasswordRecoveryForm {
  phone: string
  password: string
  dbCheckPassword?: string
  code: string
  bizId: string
}

/**
 * 用户分页数据视图对象 (UI List Item)
 */
export interface UserPageItem {
  id: number
  phone: string
  deleted: boolean
  createdAt: string | Date
  deletedAt: string | Date | null
  platform?: PlatformEnum
  name: string
  registerType: RegisterType
  discriminator: number
}

/**
 * 用户分页查询参数 (UI Query State)
 */
export interface UserPageQuery extends BaseQuery {
  name?: ConditionWrapper<string>
  phone?: ConditionWrapper<string>
  registerType?: ConditionWrapper<number>
  identity?: ConditionWrapper<string>
  discriminator?: ConditionWrapper<number>
}
