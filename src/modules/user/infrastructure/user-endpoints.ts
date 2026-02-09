import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'

export const USER_ENDPOINTS = createPrefixedEndpoints('/user', {
  LOGIN: '/login',
  REGISTER: '/register',
  GET_BY_TOKEN: '/get/',
  PASSWORD_CHANGE: '/password/change',
  ADDITIONAL_INFO_PUT: '/additional_info/put',
  PAGE: '/page',
  PASSWORD_RECOVERY: '/password/recovery',
})
