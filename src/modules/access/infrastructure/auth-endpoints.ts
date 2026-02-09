import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'

export const AUTH_ENDPOINTS = createPrefixedEndpoints('/user', {
  TOKEN_REFRESH: '/token/refresh',
})
