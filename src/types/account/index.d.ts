/**
 * 用户信息
 */
export declare interface UserInfo {
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
  'discriminator' | 'userId' | 'referrerName' | 'createdTime' | 'updatedTime',
  'referrer'
>

export declare interface UserAdditionalInfo {
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
  invitationCode?: string
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
 * 忘记密码请求数据结构
 */
export declare interface PasswordRecoveryRequest {
  phone: string
  password: string
  dbCheckPassword: string
  code: string
  bizId: string
}

/**
 * 用户账户是否激活
 * - 0 未激活
 * - 1 已激活
 */
export type UserActive = 0 | 1

/**
 * 权限数据结构
 */
export declare interface Permission {
  // 权限id
  id: number
  // 权限code
  name: string
  // 权限描述
  description: string
}
/**
 * 角色数据结构
 */
declare interface Role {
  // 角色id
  id: string
  // 角色code
  name: string
  // 角色描述
  description: string
}
