import type { BasePageRequest, IPage } from '@/modules/shared/domain/page'
import type { ApprovalInstance } from '@/modules/approval/domain/types'
import type {
  ChangePasswordRequestDTO,
  ForgetPasswordRequestDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
  UserAdditionalInfoRequestDTO,
  UserPageDTO,
} from './dto'
import type { UserInfoVo, UserPageVo } from './types'

export interface IUserRepository {
  login(data: LoginRequestDTO): Promise<UserInfoVo>
  register(data: RegisterRequestDTO): Promise<number>
  getByToken(token: string): Promise<UserInfoVo>
  changePassword(data: ChangePasswordRequestDTO): Promise<boolean>
  additionalInfoRequest(
    data: UserAdditionalInfoRequestDTO,
  ): Promise<ApprovalInstance<Record<string, unknown>>>
  getUserPage(pageRequest: BasePageRequest<UserPageDTO>): Promise<IPage<UserPageVo>>
  passwordRecovery(data: ForgetPasswordRequestDTO): Promise<boolean>
}
