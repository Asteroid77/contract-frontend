import type { BasePageRequest, IPage } from '@/modules/shared/domain/page'
import type { ApprovalInstance } from '@/modules/approval/domain/types'
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
  UserPageDTO,
} from './dto'
import type {
  RevokeDeviceSessionsResponseDto,
  TotpSetupVo,
  TotpStatusVo,
  UserDeviceSessionVo,
  UserInfoVo,
  UserPageVo,
} from './types'

export interface IUserRepository {
  login(data: LoginRequestDTO): Promise<UserInfoVo>
  register(data: RegisterRequestDTO): Promise<number>
  getByToken(token: string): Promise<UserInfoVo>
  changePassword(data: ChangePasswordRequestDTO): Promise<boolean>
  listCurrentUserDevices(): Promise<UserDeviceSessionVo[]>
  revokeCurrentUserDevices(
    data: RevokeDeviceSessionsRequestDTO,
  ): Promise<RevokeDeviceSessionsResponseDto>
  additionalInfoRequest(
    data: UserAdditionalInfoRequestDTO,
  ): Promise<ApprovalInstance<Record<string, unknown>>>
  getUserPage(pageRequest: BasePageRequest<UserPageDTO>): Promise<IPage<UserPageVo>>
  passwordRecovery(data: ForgetPasswordRequestDTO): Promise<boolean>
  logout(): Promise<boolean>
}

export interface ITotpRepository {
  verify(data: TotpVerifyRequestDTO): Promise<UserInfoVo>
  getStatus(): Promise<TotpStatusVo>
  setup(): Promise<TotpSetupVo>
  enable(data: TotpEnableRequestDTO): Promise<boolean>
  disable(data: TotpDisableRequestDTO): Promise<void>
  regenerateBackupCodes(): Promise<string[]>
}
