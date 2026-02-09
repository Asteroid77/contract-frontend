import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import type { BasePageRequest, IPage } from '@/modules/shared/domain/page'
import type {
  ChangePasswordRequestDTO,
  ForgetPasswordRequestDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
  UserAdditionalInfoRequestDTO,
  UserPageDTO,
} from '../domain/dto'
import type { UserInfoVo, UserPageVo } from '../domain/types'
import type { ApprovalInstance } from '@/modules/approval/domain/types'
import { USER_ENDPOINTS } from './user-endpoints'

import type { IUserRepository } from '../domain/repositories'

export const userRepository: IUserRepository = {
  login: (data: LoginRequestDTO) =>
    useRequest<UserInfoVo, LoginRequestDTO>({
      method: 'POST',
      url: USER_ENDPOINTS.LOGIN,
      data,
    }).then((resp) => resp.data),
  register: (data: RegisterRequestDTO) =>
    useRequest<number, RegisterRequestDTO>({
      method: 'POST',
      url: USER_ENDPOINTS.REGISTER,
      data,
    }).then((resp) => resp.data),
  getByToken: (token: string) =>
    useRequest<UserInfoVo, never>({
      method: 'GET',
      url: `${USER_ENDPOINTS.GET_BY_TOKEN}${token}`,
    }).then((resp) => resp.data),
  changePassword: (data: ChangePasswordRequestDTO) =>
    useRequest<boolean, ChangePasswordRequestDTO>({
      method: 'POST',
      url: USER_ENDPOINTS.PASSWORD_CHANGE,
      data,
    }).then((resp) => resp.data),
  additionalInfoRequest: (data: UserAdditionalInfoRequestDTO) =>
    useRequest<ApprovalInstance<Record<string, unknown>>, UserAdditionalInfoRequestDTO>({
      method: 'POST',
      url: USER_ENDPOINTS.ADDITIONAL_INFO_PUT,
      data,
    }).then((resp) => resp.data),
  getUserPage: (pageRequest: BasePageRequest<UserPageDTO>) =>
    useRequest<IPage<UserPageVo>, BasePageRequest<UserPageDTO>>({
      url: USER_ENDPOINTS.PAGE,
      method: 'POST',
      data: pageRequest,
      notify: {
        success: false,
      },
    }).then((resp) => resp.data),
  passwordRecovery: (data: ForgetPasswordRequestDTO) =>
    useRequest<boolean, ForgetPasswordRequestDTO>({
      method: 'POST',
      url: USER_ENDPOINTS.PASSWORD_RECOVERY,
      data,
    }).then((resp) => resp.data),
}
