import type { BaseQuery, ConditionWrapper } from '../request'

/**
 * 用户信息
 */
export declare interface UserInfo {
  // 主键
  id: number
  // 姓名
  name: string
  // 手机
  phone: string
  // 是否通过审批
  active: string
  // 是否逻辑删除
  isDeleted: number
  // 用户所属平台
  platform: PlatformEnum[keyof PlatformEnum]
}

export type UserAdditionalInfoRequest = Omit<
  UserAdditionalInfo,
  'discriminator' | 'userId' | 'referrerName' | 'createdTime' | 'updatedTime',
  'referrer'
>

export declare interface UserAdditionalInfo {
  id?: number
  registerType: RegisterType[keyof RegisterType]
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
  profile: UserAdditionalInfo
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
  id: number
  // 角色code
  name: string
  // 角色描述
  description: string
}

/**
 * 用户分页数据视图对象
 */
export interface UserPageVO {
  /** 主键ID */
  id: number
  /**
   * 手机号
   * @example "18892917879"
   * @minLength 11
   * @maxLength 11
   */
  phone: string

  /** 是否已删除 */
  deleted: boolean

  /** 创建时间 */
  createdAt: string | Date

  /** 删除时间 */
  deletedAt: string | Date | null

  /** 所属平台 */
  platform: PlatformEnum

  /** 用户名/公司名称 */
  name: string

  /** 注册类型（0-个人 1-企业） */
  registerType: RegisterType

  /**
   * 同名编号
   * @example 114514
   */
  discriminator: number
}

/**
 * 平台枚举
 */
export enum PlatformEnum {
  /** 微信 */
  WECHAT = 'WECHAT',
  /** GITHUB */
  GITHUB = 'GITHUB',
  /** 原生 */
  NATIVE = 'NATIVE',
}

/**
 * 注册类型枚举
 */
export enum RegisterType {
  /** 个人 */
  INDIVIDUAL = '1',
  /** 法人代表 */
  LEGALREPRESENTATIVE = '2',
}

/**
 * 用户分页查询DTO
 */
export interface UserPageDTO extends BaseQuery {
  /** 公司名称/姓名 - 支持 like, eq 查询 */
  name?: ConditionWrapper<string>

  /** 手机号 - 支持 like 查询 */
  phone?: ConditionWrapper<string>

  /** 注册平台 - 支持 eq 查询 */
  platform?: ConditionWrapper<string>

  /** 注册类型（0-个人 1-企业）- 支持 eq 查询 */
  registerType?: ConditionWrapper<number>

  /** 社会统一信用代码/姓名 - 支持 eq, like 查询 */
  identity?: ConditionWrapper<string>

  /** 同名编号 - 支持 eq 查询 */
  discriminator?: ConditionWrapper<number>
}
