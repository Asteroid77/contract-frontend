import { describe, expect, it } from 'vitest'
import { AUTH_ENDPOINTS } from '@/modules/access/infrastructure/auth-endpoints'

describe('auth-endpoints', () => {
  it('exposes token refresh endpoint under /user prefix', () => {
    expect(AUTH_ENDPOINTS.TOKEN_REFRESH).toBe('/user/token/refresh')
  })
})
