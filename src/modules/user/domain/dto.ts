import type { QueryFilters } from '@/modules/shared/domain/query'
import type { RegisterType } from './enums'

export interface LoginRequestDTO {
  phone: string
  password: string
  captcha: string
  captchaKey: string
}

export interface RegisterRequestDTO {
  phone: string
  password: string
  code: string
  bizId: string
}

export interface ForgetPasswordRequestDTO {
  phone: string
  password: string
  code: string
  bizId: string
}

export interface UserAdditionalInfoRequestDTO {
  id?: number
  registerType: RegisterType
  name: string
  userId?: number
  bankName: string
  bankAccount: string
  referrer?: number
  companyAddress?: string
  pca: string
  contactPerson?: string
  contactPersonPhone?: string
  identity: string
}

export type UserPageDTO = QueryFilters
