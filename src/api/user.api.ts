import type {
  RegisterRequest,
  RegisterResponse,
  SignInRequest,
  SignInResponse,
  UserAdditionalInfo,
  UserAdditionalInfoRequest,
  UserPageDTO,
  UserPageVO,
} from '@/types/account'
import type { ApprovalInstance } from '@/components/approval/api/approval'

import { useRequest } from '@/hooks/request/useRequest.ts'
import { createPrefixedEndpoints } from '@/_utils/api/api-prefix-generator'
import type { BasePageRequest, IPage, ServerResponse } from '@/types/request'
import { getBackendURL } from '@/_utils/request/get-backend-url'

export const ACCOUNT_API_ENDPOINTS = createPrefixedEndpoints('/user', {
  LOGIN: '/login',
  REGISTER: '/register',
  GET_USERINFO_BY_TOKEN: `/get/`,
  ADDITIONAL_INFO_PUT: `/additional_info/put`,
  PAGE: '/page',
})
const serverURL = getBackendURL()
export const OAUTH2_API_ENDPOINTS = createPrefixedEndpoints(serverURL + '/oauth2', {
  GET_OAUTH2_AUTHORIZATION_URL: `/authorization/`,
})
export const userApi = {
  login: (data: SignInRequest): Promise<ServerResponse<SignInResponse>> => {
    return useRequest<ServerResponse<SignInResponse>, SignInRequest>(
      {
        method: 'POST',
        url: ACCOUNT_API_ENDPOINTS.LOGIN,
        data: data,
      },
      ['login'],
    )
  },
  register: (data: RegisterRequest): Promise<ServerResponse<RegisterResponse>> => {
    return useRequest<ServerResponse<RegisterResponse>, RegisterRequest>(
      {
        method: 'POST',
        url: ACCOUNT_API_ENDPOINTS.REGISTER,
        data,
      },
      ['signUp'],
    )
  },
  getUserInfoByToken: (token: string): Promise<ServerResponse<SignInResponse>> => {
    return useRequest<ServerResponse<SignInResponse>, never>(
      {
        method: 'GET',
        url: `${ACCOUNT_API_ENDPOINTS.GET_USERINFO_BY_TOKEN}${token}`,
      },
      ['userInfo', 'token', token],
    )
  },
  additionalInfoRequest: (
    formData: UserAdditionalInfoRequest,
  ): Promise<ServerResponse<ApprovalInstance<UserAdditionalInfo>>> => {
    return useRequest<
      ServerResponse<ApprovalInstance<UserAdditionalInfo>>,
      UserAdditionalInfoRequest
    >({
      method: 'POST',
      url: ACCOUNT_API_ENDPOINTS.ADDITIONAL_INFO_PUT,
      data: formData,
    })
  },
  getUserPage: (
    pageRequest: BasePageRequest<UserPageDTO>,
  ): Promise<ServerResponse<IPage<UserPageVO>>> => {
    return useRequest<ServerResponse<IPage<UserPageVO>>, BasePageRequest<UserPageDTO>>({
      url: ACCOUNT_API_ENDPOINTS.PAGE,
      method: 'POST',
      data: pageRequest,
      notify: {
        success: false,
      },
    })
  },
}
