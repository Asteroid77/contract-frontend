import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'

export const USER_ENDPOINTS = createPrefixedEndpoints('/user', {
  LOGIN: '/login',
  REGISTER: '/register',
  ME: '/me',
  DETAIL: (...args: unknown[]) => `/${String(args[0] ?? '')}`,
  PASSWORD_CHANGE: '/password/change',
  DEVICES: '/devices',
  DEVICES_REVOKE: '/devices/revoke',
  ADDITIONAL_INFO_PUT: '/additional_info/put',
  PAGE: '/page',
  PASSWORD_RECOVERY: '/password/recovery',
  LOGOUT: '/logout',
})
