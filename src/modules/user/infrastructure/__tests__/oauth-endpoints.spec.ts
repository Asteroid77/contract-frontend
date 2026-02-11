import { describe, expect, it, vi } from 'vitest'

vi.mock('@/app/infrastructure/request/get-backend-url', () => ({
  getBackendURL: vi.fn(() => 'https://api.example.com'),
}))

import {
  OAUTH2_ENDPOINTS,
  buildOauth2AuthorizationUrl,
} from '@/modules/user/infrastructure/oauth-endpoints'

describe('oauth-endpoints', () => {
  it('builds prefixed oauth2 authorization endpoint', () => {
    expect(OAUTH2_ENDPOINTS.AUTHORIZATION).toBe('https://api.example.com/oauth2/authorization/')
  })

  it('buildOauth2AuthorizationUrl appends platform', () => {
    expect(buildOauth2AuthorizationUrl('github')).toBe(
      'https://api.example.com/oauth2/authorization/github',
    )
    expect(buildOauth2AuthorizationUrl('wechat')).toBe(
      'https://api.example.com/oauth2/authorization/wechat',
    )
  })
})
