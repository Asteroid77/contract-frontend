import type {
  RegisterRequest,
  RegisterResponse,
  SignInRequest,
  SignInResponse,
  UserAdditionalInfo,
  UserAdditionalInfoRequest,
} from '@/types/account'
import type { ApprovalIsntance } from '@/api/types/approval'

import { useRequest } from '@/hooks/request/useRequest.ts'
import { createPrefixedEndpoints } from '@/api/api-prefix-generator.ts'

export const ACCOUNT_API_ENDPOINTS = createPrefixedEndpoints('/user', {
  LOGIN: '/login',
  REGISTER: '/register',
  GET_USERINFO_BY_TOKEN: `/get/`,
  ADDITIONAL_INFO_PUT: `/additional_info/put`,
})
const serverURL = import.meta.env.VITE_BACKEND_SERVER_URL
export const OAUTH2_API_ENDPOINTS = createPrefixedEndpoints(serverURL + '/oauth2', {
  GET_OAUTH2_AUTHORIZATION_URL: `/authorization/`,
})
export const userApi = {
  login: (data: SignInRequest): Promise<SignInResponse> => {
    return useRequest<SignInResponse, SignInRequest>(
      {
        method: 'POST',
        url: ACCOUNT_API_ENDPOINTS.LOGIN,
        data: data,
      },
      ['login'],
    )
  },
  register: (data: RegisterRequest): Promise<RegisterResponse> => {
    return useRequest<RegisterResponse, RegisterRequest>(
      {
        method: 'POST',
        url: ACCOUNT_API_ENDPOINTS.REGISTER,
        data,
      },
      ['signUp'],
    )
  },
  getUserInfoByToken: (token: string): Promise<SignInResponse> => {
    return useRequest<SignInResponse, never>(
      {
        method: 'GET',
        url: `${ACCOUNT_API_ENDPOINTS.GET_USERINFO_BY_TOKEN}${token}`,
      },
      ['userInfo', 'token', token],
    )
  },
  additionalInfoRequest: (
    formData: UserAdditionalInfoRequest,
  ): Promise<ApprovalIsntance<UserAdditionalInfo>> => {
    return useRequest<ApprovalIsntance<UserAdditionalInfo>, UserAdditionalInfoRequest>({
      method: 'POST',
      url: ACCOUNT_API_ENDPOINTS.ADDITIONAL_INFO_PUT,
      data: formData,
    })
  },
}
