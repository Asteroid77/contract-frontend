import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'
import type { BasePageRequest, IPage } from '@/modules/shared/domain/page'
import type { ServerResponse } from '@/modules/shared/domain/response'
import type {
  ForgetPasswordRequestDTO,
  LoginRequestDTO,
  RegisterRequestDTO,
  UserAdditionalInfoRequestDTO,
  UserPageDTO,
} from '../domain/dto'
import type { UserInfoVo, UserPageVo } from '../domain/types'
import type { ApprovalInstance } from '@/modules/approval/domain/types'

const USER_ENDPOINTS = createPrefixedEndpoints('/user', {
  LOGIN: '/login',
  REGISTER: '/register',
  GET_BY_TOKEN: '/get/',
  ADDITIONAL_INFO_PUT: '/additional_info/put',
  PAGE: '/page',
  PASSWORD_RECOVERY: '/password/recovery',
})

export const userRepository = {
  login: (data: LoginRequestDTO) =>
    useRequest<ServerResponse<UserInfoVo>, LoginRequestDTO>({
      method: 'POST',
      url: USER_ENDPOINTS.LOGIN,
      data,
    }).then((resp) => resp.data),
  register: (data: RegisterRequestDTO) =>
    useRequest<ServerResponse<number>, RegisterRequestDTO>({
      method: 'POST',
      url: USER_ENDPOINTS.REGISTER,
      data,
    }).then((resp) => resp.data),
  getByToken: (token: string) =>
    useRequest<ServerResponse<UserInfoVo>, never>({
      method: 'GET',
      url: `${USER_ENDPOINTS.GET_BY_TOKEN}${token}`,
    }).then((resp) => resp.data),
  additionalInfoRequest: (data: UserAdditionalInfoRequestDTO) =>
    useRequest<ServerResponse<ApprovalInstance<Record<string, unknown>>>, UserAdditionalInfoRequestDTO>({
      method: 'POST',
      url: USER_ENDPOINTS.ADDITIONAL_INFO_PUT,
      data,
    }).then((resp) => resp.data),
  getUserPage: (pageRequest: BasePageRequest<UserPageDTO>) =>
    useRequest<ServerResponse<IPage<UserPageVo>>, BasePageRequest<UserPageDTO>>({
      url: USER_ENDPOINTS.PAGE,
      method: 'POST',
      data: pageRequest,
      notify: {
        success: false,
      },
    }).then((resp) => resp.data),
  passwordRecovery: (data: ForgetPasswordRequestDTO) =>
    useRequest<ServerResponse<boolean>, ForgetPasswordRequestDTO>({
      method: 'POST',
      url: USER_ENDPOINTS.PASSWORD_RECOVERY,
      data,
    }).then((resp) => resp.data),
}
