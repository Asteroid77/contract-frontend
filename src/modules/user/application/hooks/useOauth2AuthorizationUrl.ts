import { buildOauth2AuthorizationUrl } from '@/modules/user/infrastructure/oauth-endpoints'

export function useOauth2AuthorizationUrl(platform: string): WindowProxy | null {
  return window.open(
    buildOauth2AuthorizationUrl(platform),
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
