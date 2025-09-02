import { OAUTH2_API_ENDPOINTS } from '@/api/user.api.ts'

export function useOauth2AuthorizationUrl(platform: string): WindowProxy | null {
  return window.open(
    OAUTH2_API_ENDPOINTS.GET_OAUTH2_AUTHORIZATION_URL + platform,
    `Oauth2Auth`,
    [
      `width=550`,
      `height=650`,
      `left=${Math.max(0, (screen.width - 550) / 2)}`,
      `top=${Math.max(0, (screen.height - 650) / 2)}`,
      'resizable=yes',
      'scrollbars=yes',
    ].join(','),
  )
}
