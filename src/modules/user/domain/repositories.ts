import type { BasePageRequest, IPage } from '@/modules/shared/domain/page'
import type { ApprovalInstance } from '@/modules/approval/domain/types'
import type {
  ChangePasswordRequestDTO,
  ForgetPasswordRequestDTO,
  LoginRequestDTO,
  OAuth2ExchangeRequestDTO,
  RegisterRequestDTO,
  RevokeDeviceSessionsRequestDTO,
  TotpDisableRequestDTO,
  TotpEnableRequestDTO,
  TotpVerifyRequestDTO,
  UserAdditionalInfoRequestDTO,
  UserPageDTO,
} from './dto'
import type {
  OAuth2ExchangeVo,
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
  exchangeOAuth2Code(data: OAuth2ExchangeRequestDTO): Promise<OAuth2ExchangeVo>
  getCurrentUserInfo(accessToken?: string): Promise<UserInfoVo>
  getUserInfoById(userId: number): Promise<UserInfoVo>
  changePassword(data: ChangePasswordRequestDTO): Promise<boolean>
  deleteUser(userId: number): Promise<boolean>
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
