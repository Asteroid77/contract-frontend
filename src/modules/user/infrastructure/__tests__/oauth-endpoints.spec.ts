import { describe, expect, it, vi } from 'vitest'

vi.mock('@/app/infrastructure/request/get-backend-url', () => ({
  getBackendURL: vi.fn(() => 'https://api.example.com'),
}))

import {
  OAUTH2_ENDPOINTS,
  buildOauth2AuthorizationUrl,
} from '@/modules/user/infrastructure/oauth-endpoints'

describe('oauth-endpoints', () => {
  it('builds prefixed oauth2 authorization and exchange endpoints', () => {
    expect(OAUTH2_ENDPOINTS.AUTHORIZATION).toBe('https://api.example.com/oauth2/authorization/')
    expect(OAUTH2_ENDPOINTS.EXCHANGE).toBe('https://api.example.com/oauth2/exchange')
  })

  it('buildOauth2AuthorizationUrl appends platform and rememberMe', () => {
    expect(buildOauth2AuthorizationUrl('github')).toBe(
      'https://api.example.com/oauth2/authorization/github?rememberMe=false',
    )
    expect(buildOauth2AuthorizationUrl('wechat', true)).toBe(
      'https://api.example.com/oauth2/authorization/wechat?rememberMe=true',
    )
  })
})
