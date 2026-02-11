import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import type {
  TotpVerifyRequestDTO,
  TotpEnableRequestDTO,
  TotpDisableRequestDTO,
} from '../domain/dto'
import type { UserInfoVo, TotpStatusVo, TotpSetupVo } from '../domain/types'
import type { ITotpRepository } from '../domain/repositories'
import { TOTP_ENDPOINTS } from './totp-endpoints'

export const totpRepository: ITotpRepository = {
  verify: (data: TotpVerifyRequestDTO) =>
    useRequest<UserInfoVo, TotpVerifyRequestDTO>({
      method: 'POST',
      url: TOTP_ENDPOINTS.VERIFY,
      data,
      skipAuthToken: true,
      skipAuthRefresh: true,
    }).then((resp) => resp.data),

  getStatus: () =>
    useRequest<TotpStatusVo, never>({
      method: 'GET',
      url: TOTP_ENDPOINTS.STATUS,
      notify: { success: false },
    }).then((resp) => resp.data),

  setup: () =>
    useRequest<TotpSetupVo, never>({
      method: 'POST',
      url: TOTP_ENDPOINTS.SETUP,
    }).then((resp) => resp.data),

  enable: (data: TotpEnableRequestDTO) =>
    useRequest<boolean, TotpEnableRequestDTO>({
      method: 'POST',
      url: TOTP_ENDPOINTS.ENABLE,
      data,
    }).then((resp) => resp.data),

  disable: (data: TotpDisableRequestDTO) =>
    useRequest<void, TotpDisableRequestDTO>({
      method: 'POST',
      url: TOTP_ENDPOINTS.DISABLE,
      data,
    }).then(() => undefined),

  regenerateBackupCodes: () =>
    useRequest<string[], never>({
      method: 'POST',
      url: TOTP_ENDPOINTS.BACKUP_CODES,
    }).then((resp) => resp.data),
}
