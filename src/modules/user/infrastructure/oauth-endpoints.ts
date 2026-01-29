import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'
import { getBackendURL } from '@/app/infrastructure/request/get-backend-url'

const serverURL = getBackendURL()

export const OAUTH2_ENDPOINTS = createPrefixedEndpoints(`${serverURL}/oauth2`, {
  AUTHORIZATION: '/authorization/',
})

export const buildOauth2AuthorizationUrl = (platform: string) =>
  `${OAUTH2_ENDPOINTS.AUTHORIZATION}${platform}`
