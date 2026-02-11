import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { STORAGE_KEYS } from '@/constants/storage'
import { apiClient } from '@/app/infrastructure/request/http-client'
import {
  clearAuthTokens,
  forceRefreshAccessToken,
  isAccessTokenExpiringSoon,
  refreshAccessTokenIfNeeded,
  setAuthTokens,
} from '@/modules/access/application/token-manager'
import { AUTH_ENDPOINTS } from '@/modules/access/infrastructure/auth-endpoints'

const toBase64Url = (input: string): string =>
  btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

const createJwtWithExpOffset = (offsetSeconds: number): string => {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = toBase64Url(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + offsetSeconds,
    }),
  )

  return `${header}.${payload}.signature`
}

const buildRefreshSuccessResponse = (accessToken: string, refreshToken: string) => ({
  type: 'about:blank',
  title: 'ok',
  status: 200,
  detail: 'ok',
  code: 0,
  traceId: 'trace-refresh',
  data: {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: 7200,
  },
})

let mock: AxiosMockAdapter

describe('token-manager', () => {
  beforeEach(() => {
    mock = new AxiosMockAdapter(apiClient)
    localStorage.clear()
  })

  afterEach(() => {
    mock.restore()
    clearAuthTokens()
  })

  it('detects accessToken nearing expiration', () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(60),
      refreshToken: 'refresh-token',
    })
    expect(isAccessTokenExpiringSoon(300)).toBe(true)

    setAuthTokens({
      accessToken: createJwtWithExpOffset(1800),
      refreshToken: 'refresh-token',
    })
    expect(isAccessTokenExpiringSoon(300)).toBe(false)
  })

  it('returns false for malformed jwt token', () => {
    setAuthTokens({
      accessToken: 'not-a-jwt',
      refreshToken: 'refresh-token',
    })

    expect(isAccessTokenExpiringSoon(300)).toBe(false)
  })

  it('removes refresh token when setAuthTokens called without refreshToken', () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(1800),
      refreshToken: 'refresh-token',
    })

    setAuthTokens({
      accessToken: createJwtWithExpOffset(1200),
    })

    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull()
  })

  it('returns null when refresh not needed', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(1800),
      refreshToken: 'refresh-token',
    })

    await expect(refreshAccessTokenIfNeeded(300)).resolves.toBeNull()
    expect(mock.history.post).toHaveLength(0)
  })

  it('returns null when refresh token is missing', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(30),
    })

    await expect(refreshAccessTokenIfNeeded(300)).resolves.toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull()
  })

  it('throws when force refresh is called without refreshToken', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(30),
    })

    await expect(forceRefreshAccessToken()).rejects.toThrow('Refresh token is missing')
  })

  it('refreshes tokens when accessToken is expiring soon', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(60),
      refreshToken: 'refresh-old',
    })

    mock
      .onPost(AUTH_ENDPOINTS.TOKEN_REFRESH, {
        refreshToken: 'refresh-old',
      })
      .reply(200, buildRefreshSuccessResponse('access-new', 'refresh-new'))

    const refreshed = await refreshAccessTokenIfNeeded(300)

    expect(refreshed).toEqual({
      accessToken: 'access-new',
      refreshToken: 'refresh-new',
    })
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('access-new')
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-new')
  })

  it('reuses one refresh request for concurrent refresh calls', async () => {
    let refreshCallCount = 0

    setAuthTokens({
      accessToken: createJwtWithExpOffset(10),
      refreshToken: 'refresh-old',
    })

    mock.onPost(AUTH_ENDPOINTS.TOKEN_REFRESH).reply(async () => {
      refreshCallCount += 1
      await new Promise((resolve) => setTimeout(resolve, 10))
      return [200, buildRefreshSuccessResponse('access-new', 'refresh-new')]
    })

    const [first, second] = await Promise.all([forceRefreshAccessToken(), forceRefreshAccessToken()])

    expect(refreshCallCount).toBe(1)
    expect(first).toEqual(second)
    expect(first.accessToken).toBe('access-new')
  })

  it('clears tokens when refresh response misses required fields', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(10),
      refreshToken: 'refresh-old',
    })

    mock.onPost(AUTH_ENDPOINTS.TOKEN_REFRESH).reply(200, {
      type: 'about:blank',
      title: 'ok',
      status: 200,
      detail: 'ok',
      code: 0,
      traceId: 'trace-refresh-missing',
      data: {
        accessToken: 'access-new',
      },
    })

    await expect(forceRefreshAccessToken()).rejects.toThrow(
      'Refresh token response missing required fields',
    )

    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull()
  })

  it('clears tokens when refresh failed', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(10),
      refreshToken: 'refresh-old',
    })

    mock.onPost(AUTH_ENDPOINTS.TOKEN_REFRESH).reply(401, {
      type: 'about:blank',
      title: 'unauthorized',
      status: 401,
      detail: 'refresh token invalid',
      code: 401,
      traceId: 'trace-refresh-failed',
    })

    await expect(forceRefreshAccessToken()).rejects.toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull()
  })
})
