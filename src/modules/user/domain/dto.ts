import type { QueryFilters } from '@/modules/shared/domain/query'
import type { RegisterType } from './enums'

export interface LoginRequestDTO {
  phone: string
  password: string
  captcha: string
  captchaKey: string
  rememberMe?: boolean
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

export interface ChangePasswordRequestDTO {
  oldPassword: string
  newPassword: string
}

export interface RevokeDeviceSessionsRequestDTO {
  deviceIds: string[]
  allowCurrentDevice?: boolean
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

// --- TOTP DTOs ---

export interface TotpVerifyRequestDTO {
  twoFactorToken: string
  code: string
  rememberMe: boolean
  rememberDevice: boolean
}

export interface TotpEnableRequestDTO {
  code: string
}

export interface TotpDisableRequestDTO {
  password: string
}

export interface OAuth2ExchangeRequestDTO {
  authCode: string
}
