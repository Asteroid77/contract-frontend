import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'
import { getBackendURL } from '@/app/infrastructure/request/get-backend-url'

const serverURL = getBackendURL()

export const OAUTH2_ENDPOINTS = createPrefixedEndpoints(`${serverURL}/oauth2`, {
  AUTHORIZATION: '/authorization/',
  EXCHANGE: '/exchange',
})

export const buildOauth2AuthorizationUrl = (platform: string, rememberMe = false) =>
  `${OAUTH2_ENDPOINTS.AUTHORIZATION}${platform}?rememberMe=${String(rememberMe)}`
