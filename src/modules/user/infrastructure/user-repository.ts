import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import type { BasePageRequest, IPage } from '@/modules/shared/domain/page'
import type {
  ChangePasswordRequestDTO,
  ForgetPasswordRequestDTO,
  LoginRequestDTO,
  OAuth2ExchangeRequestDTO,
  RegisterRequestDTO,
  RevokeDeviceSessionsRequestDTO,
  UserAdditionalInfoRequestDTO,
  UserPageDTO,
} from '../domain/dto'
import type {
  OAuth2ExchangeVo,
  RevokeDeviceSessionsResponseDto,
  UserDeviceSessionVo,
  UserInfoVo,
  UserPageVo,
} from '../domain/types'
import type { ApprovalInstance } from '@/modules/approval/domain/types'
import { USER_ENDPOINTS } from './user-endpoints'
import { OAUTH2_ENDPOINTS } from './oauth-endpoints'

import type { IUserRepository } from '../domain/repositories'

export const userRepository: IUserRepository = {
  login: (data: LoginRequestDTO) =>
    useRequest<UserInfoVo, LoginRequestDTO>({
      method: 'POST',
      url: USER_ENDPOINTS.LOGIN,
      data,
      withCredentials: true,
    }).then((resp) => resp.data),
  register: (data: RegisterRequestDTO) =>
    useRequest<number, RegisterRequestDTO>({
      method: 'POST',
      url: USER_ENDPOINTS.REGISTER,
      data,
    }).then((resp) => resp.data),
  exchangeOAuth2Code: (data: OAuth2ExchangeRequestDTO) =>
    useRequest<OAuth2ExchangeVo, OAuth2ExchangeRequestDTO>({
      method: 'POST',
      url: OAUTH2_ENDPOINTS.EXCHANGE,
      data,
      skipAuthToken: true,
      skipAuthRefresh: true,
      withCredentials: true,
    }).then((resp) => resp.data),
  getCurrentUserInfo: (accessToken?: string) =>
    useRequest<UserInfoVo, never>({
      method: 'GET',
      url: USER_ENDPOINTS.ME,
      ...(accessToken
        ? {
            headers: {
              Authorization: accessToken,
            },
            // OAuth2 回调首跳使用传入 token，避免复用旧本地 token 干扰请求。
            skipAuthToken: true,
            skipAuthRefresh: true,
          }
        : {}),
    }).then((resp) => {
      if (!accessToken || resp.data.token) {
        return resp.data
      }
      return {
        ...resp.data,
        token: accessToken,
      }
    }),
  changePassword: (data: ChangePasswordRequestDTO) =>
    useRequest<boolean, ChangePasswordRequestDTO>({
      method: 'POST',
      url: USER_ENDPOINTS.PASSWORD_CHANGE,
      data,
    }).then((resp) => resp.data),
  listCurrentUserDevices: () =>
    useRequest<UserDeviceSessionVo[], never>({
      method: 'GET',
      url: USER_ENDPOINTS.DEVICES,
      notify: {
        success: false,
      },
    }).then((resp) => resp.data),
  revokeCurrentUserDevices: (data: RevokeDeviceSessionsRequestDTO) =>
    useRequest<RevokeDeviceSessionsResponseDto, RevokeDeviceSessionsRequestDTO>({
      method: 'POST',
      url: USER_ENDPOINTS.DEVICES_REVOKE,
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
  logout: () =>
    useRequest<boolean, never>({
      method: 'POST',
      url: USER_ENDPOINTS.LOGOUT,
      skipAuthRefresh: true,
      withCredentials: true,
      notify: { success: false },
    }).then((resp) => resp.data),
}
