import type { ApprovalIsntanceRequest } from '../approval'

/**
 * 用户信息
 */
declare interface UserInfo {
  // 主键
  id: string
  // 姓名
  name: string
  // 手机
  phone: string
  // 是否通过审批
  active: string
  // 是否逻辑删除
  isDeleted: number
}

export type UserAdditionalInfoRequest = Omit<
  UserAdditionalInfo,
  'discriminator' | 'userId' | 'referrerName' | 'createdTime' | 'updatedTime'
>

declare interface UserAdditionalInfo {
  id?: number
  registerType: RegisterType
  name: string
  bankName?: string
  bankAccount?: string
  referrer?: number
  companyAddress?: string
  pca: string
  contractPerson?: string
  contractPersonPhone?: string
  identity: string
  discriminator: number
  userId: number
  referrerName: string
  createdTime: string
  updatedTime: string
}

/**
 * 登录请求数据结构
 */
export declare interface SignInRequest {
  phone: string
  password: string
  captchaKey: string
  captcha: string
  remember?: boolean
}

/**
 * 登录成功后返回数据结构
 */
export declare interface SignInResponse {
  user: UserInfo
  token: string
  permissionList: Permission[]
  roleList: Role[]
}

/**
 * 注册请求数据结构
 */
export declare interface RegisterRequest {
  phone: string
  password: string
  code: string
  dbCheckPassword: string
  bizId: string
}
export type RegisterType = '1' | '2'

/**
 * 注册成功后返回数据结构
 */
export declare interface RegisterResponse {
  userId: number
  name: string
  phone: string
  active: UserActive
  isDeleted: number
}

/**
 * 用户账户是否激活
 * - 0 未激活
 * - 1 已激活
 */
export type UserActive = 0 | 1
