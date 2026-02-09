import type { RegisterType, PlatformEnum } from './enums'
import type { RoleVo, Permission } from '@/modules/access/domain/types'

export interface User {
  id: number
  pwd?: string
  phone: string
  isDeleted?: boolean
  createdTime?: string
  updatedTime?: string
  deletedTime?: string | null
}

export interface UserAdditionalInfoVo {
  id: number
  name: string
  discriminator: number
  registerType: RegisterType
  userId: number
  bankName: string
  bankAccount: string
  referrer: number | null
  pca: string
  companyAddress: string | null
  contactPerson: string | null
  contactPersonPhone: string | null
  identity: string
  createdTime: string
  updatedTime: string
  inviterName: string | null
  inviterDiscriminator?: number | null
  invitationCode: string | null
}

export interface UserInfoVo {
  base: User
  profile: UserAdditionalInfoVo | null
  token: string
  refreshToken?: string
  roleList: RoleVo[]
  permissionList: Permission[]
  needProfile: boolean
}

export interface UserPageVo {
  id: number
  phone: string
  deleted: boolean
  createdAt: string
  deletedAt: string | null
  name: string
  registerType: RegisterType
  discriminator: number
  platform?: PlatformEnum
}
