import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AxiosMockAdapter from 'axios-mock-adapter'
import { STORAGE_KEYS } from '@/constants/storage'
import { apiClient } from '@/app/infrastructure/request/http-client'
import {
  clearAuthTokens,
  forceRefreshAccessToken,
  getStoredAccessTokenExpiresAt,
  isAccessTokenExpiringSoon,
  isLogoutInProgress,
  REFRESH_LOCK_STORAGE_KEY,
  refreshAccessTokenIfNeeded,
  setAuthTokens,
  setLogoutInProgress,
} from '@/modules/access/application/token-manager'
import { AUTH_ENDPOINTS } from '@/modules/access/infrastructure/auth-endpoints'
import { ResponseCode } from '@/modules/shared/application/constants/response-code'

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

const toRefreshLockPayload = (refreshToken: string, ownerId: string = 'other-tab') => ({
  ownerId,
  refreshToken,
  expireAt: Date.now() + 2000,
})

describe('token-manager', () => {
  beforeEach(() => {
    mock = new AxiosMockAdapter(apiClient)
    localStorage.clear()
    setLogoutInProgress(false)
  })

  afterEach(() => {
    mock.restore()
    setLogoutInProgress(false)
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

  it('persists access token expiration timestamp from expiresIn', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date('2026-02-17T00:00:00.000Z'))

      setAuthTokens({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 120,
      })

      expect(getStoredAccessTokenExpiresAt()).toBe(Date.now() + 120000)
    } finally {
      vi.useRealTimers()
    }
  })

  it('clears stored expiresAt when access token rotates without expiresIn', () => {
    setAuthTokens({
      accessToken: 'access-token-1',
      refreshToken: 'refresh-token',
      expiresIn: 120,
    })
    expect(getStoredAccessTokenExpiresAt()).not.toBeNull()

    setAuthTokens({
      accessToken: 'access-token-2',
      refreshToken: 'refresh-token',
    })

    expect(getStoredAccessTokenExpiresAt()).toBeNull()
  })

  it('keeps stored expiresAt when token is unchanged and expiresIn is omitted', () => {
    setAuthTokens({
      accessToken: 'access-token-1',
      refreshToken: 'refresh-token-1',
      expiresIn: 120,
    })

    const expiresAt = getStoredAccessTokenExpiresAt()

    setAuthTokens({
      accessToken: 'access-token-1',
      refreshToken: 'refresh-token-2',
    })

    expect(getStoredAccessTokenExpiresAt()).toBe(expiresAt)
  })

  it('does not schedule proactive refresh when token is already near expiry', async () => {
    vi.useFakeTimers()
    try {
      setAuthTokens({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 5,
      })

      await vi.advanceTimersByTimeAsync(10000)
      expect(mock.history.post).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('triggers proactive refresh before expiration when expiresIn is provided', async () => {
    vi.useFakeTimers()
    try {
      setAuthTokens({
        accessToken: 'access-token',
        refreshToken: 'refresh-old',
        expiresIn: 50,
      })

      mock
        .onPost(AUTH_ENDPOINTS.TOKEN_REFRESH)
        .reply(200, buildRefreshSuccessResponse('access-new', 'refresh-new'))

      await vi.advanceTimersByTimeAsync(39000)
      expect(mock.history.post).toHaveLength(0)

      await vi.advanceTimersByTimeAsync(2000)
      expect(mock.history.post).toHaveLength(1)
      const refreshRequest = mock.history.post[0]
      expect(refreshRequest.withCredentials).toBe(true)
      expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('access-new')
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-new')
    } finally {
      vi.useRealTimers()
    }
  })

  it('cancels proactive refresh scheduling during logout flow', async () => {
    vi.useFakeTimers()
    try {
      setAuthTokens({
        accessToken: 'access-token',
        refreshToken: 'refresh-old',
        expiresIn: 50,
      })
      setLogoutInProgress(true)

      mock
        .onPost(AUTH_ENDPOINTS.TOKEN_REFRESH)
        .reply(200, buildRefreshSuccessResponse('access-new', 'refresh-new'))

      await vi.advanceTimersByTimeAsync(50000)
      expect(mock.history.post).toHaveLength(0)
    } finally {
      vi.useRealTimers()
      setLogoutInProgress(false)
    }
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

  it('suppresses refresh when logout is in progress', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(30),
      refreshToken: 'refresh-token',
    })
    setLogoutInProgress(true)

    await expect(refreshAccessTokenIfNeeded(300)).resolves.toBeNull()
    await expect(forceRefreshAccessToken()).rejects.toThrow('Refresh suppressed during logout')
    expect(isLogoutInProgress()).toBe(true)
    expect(mock.history.post).toHaveLength(0)
  })

  it('does not persist refresh failure cooldown for logout-suppressed refresh', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(30),
      refreshToken: 'refresh-token',
    })
    setLogoutInProgress(true)

    await expect(forceRefreshAccessToken()).rejects.toThrow('Refresh suppressed during logout')

    expect(localStorage.getItem('AUTH_REFRESH_FAILURE_STATE')).toBeNull()
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
    const refreshRequest = mock.history.post[0]
    expect(refreshRequest.withCredentials).toBe(true)
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('access-new')
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-new')
    expect(getStoredAccessTokenExpiresAt()).not.toBeNull()
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

    const [first, second] = await Promise.all([
      forceRefreshAccessToken(),
      forceRefreshAccessToken(),
    ])

    expect(refreshCallCount).toBe(1)
    expect(first).toEqual(second)
    expect(first.accessToken).toBe('access-new')
  })

  it('keeps old tokens when refresh response misses required fields', async () => {
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

    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-old')
  })

  it('keeps tokens when refresh failed with plain 401', async () => {
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
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-old')
  })

  it('clears tokens when refresh failed with invalid-grant business code', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(10),
      refreshToken: 'refresh-old',
    })

    mock.onPost(AUTH_ENDPOINTS.TOKEN_REFRESH).reply(400, {
      type: 'about:blank',
      title: 'refresh grant invalid',
      status: 400,
      detail: 'refresh token revoked',
      code: ResponseCode.AUTH_REFRESH_GRANT_INVALID,
      traceId: 'trace-refresh-expired',
      data: {
        oauthError: 'invalid_grant',
        reason: 'refresh_token_revoked',
      },
    })

    await expect(forceRefreshAccessToken()).rejects.toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull()
  })

  it('keeps tokens when refresh failed with forbidden origin error', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(10),
      refreshToken: 'refresh-old',
    })

    mock.onPost(AUTH_ENDPOINTS.TOKEN_REFRESH).reply(403, {
      type: 'about:blank',
      title: 'origin invalid',
      status: 403,
      detail: '请求来源校验失败',
      code: ResponseCode.AUTH_REQUEST_ORIGIN_INVALID,
      traceId: 'trace-refresh-origin',
    })

    await expect(forceRefreshAccessToken()).rejects.toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-old')
  })

  it('keeps old tokens when refresh request fails due network error', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(10),
      refreshToken: 'refresh-old',
    })

    mock.onPost(AUTH_ENDPOINTS.TOKEN_REFRESH).networkError()

    await expect(forceRefreshAccessToken()).rejects.toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBeTruthy()
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-old')
  })

  it('blocks rapid repeated refresh attempts after failure to avoid refresh storm', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(10),
      refreshToken: 'refresh-old',
    })

    mock.onPost(AUTH_ENDPOINTS.TOKEN_REFRESH).networkError()

    await expect(forceRefreshAccessToken()).rejects.toBeTruthy()
    await expect(forceRefreshAccessToken()).rejects.toThrow(
      'Refresh temporarily blocked after recent failure',
    )
    expect(mock.history.post).toHaveLength(1)
  })

  it('respects cross-tab refresh failure cooldown persisted in localStorage', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(10),
      refreshToken: 'refresh-old',
    })

    localStorage.setItem(
      'AUTH_REFRESH_FAILURE_STATE',
      JSON.stringify({
        refreshToken: 'refresh-old',
        failureCount: 2,
        lastFailedAt: Date.now() - 100,
        blockedUntil: Date.now() + 5000,
      }),
    )

    await expect(forceRefreshAccessToken()).rejects.toThrow(
      'Refresh temporarily blocked after recent failure',
    )
    expect(mock.history.post).toHaveLength(0)
  })

  it('ignores stale cooldown state when refresh token has rotated', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(10),
      refreshToken: 'refresh-new',
    })

    localStorage.setItem(
      'AUTH_REFRESH_FAILURE_STATE',
      JSON.stringify({
        refreshToken: 'refresh-old',
        failureCount: 2,
        lastFailedAt: Date.now() - 100,
        blockedUntil: Date.now() + 5000,
      }),
    )

    mock
      .onPost(AUTH_ENDPOINTS.TOKEN_REFRESH)
      .reply(200, buildRefreshSuccessResponse('access-next', 'refresh-next'))

    await expect(forceRefreshAccessToken()).resolves.toEqual({
      accessToken: 'access-next',
      refreshToken: 'refresh-next',
    })
    expect(mock.history.post).toHaveLength(1)
  })

  it('does not block refresh for lock entries tied to a different refresh token', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(10),
      refreshToken: 'refresh-current',
    })

    localStorage.setItem(
      REFRESH_LOCK_STORAGE_KEY,
      JSON.stringify(toRefreshLockPayload('refresh-other')),
    )

    mock
      .onPost(AUTH_ENDPOINTS.TOKEN_REFRESH)
      .reply(200, buildRefreshSuccessResponse('access-next', 'refresh-next'))

    await expect(forceRefreshAccessToken()).resolves.toEqual({
      accessToken: 'access-next',
      refreshToken: 'refresh-next',
    })
    expect(mock.history.post).toHaveLength(1)
  })

  it('reuses latest tokens when another tab has already rotated refresh token', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(10),
      refreshToken: 'refresh-old',
    })

    mock.onPost(AUTH_ENDPOINTS.TOKEN_REFRESH).reply(() => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-from-other-tab')
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-from-other-tab')

      return [
        401,
        {
          type: 'about:blank',
          title: 'unauthorized',
          status: 401,
          detail: 'refresh token invalid',
          code: 401,
          traceId: 'trace-refresh-race',
        },
      ]
    })

    await expect(forceRefreshAccessToken()).resolves.toEqual({
      accessToken: 'access-from-other-tab',
      refreshToken: 'refresh-from-other-tab',
    })
    expect(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)).toBe('access-from-other-tab')
    expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-from-other-tab')
  })

  it('waits for cross-tab refresh lock and reuses tokens without sending duplicate refresh', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(10),
      refreshToken: 'refresh-old',
    })

    localStorage.setItem(
      REFRESH_LOCK_STORAGE_KEY,
      JSON.stringify(toRefreshLockPayload('refresh-old')),
    )

    setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-from-other-tab')
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-from-other-tab')
      localStorage.removeItem(REFRESH_LOCK_STORAGE_KEY)
    }, 50)

    await expect(forceRefreshAccessToken()).resolves.toEqual({
      accessToken: 'access-from-other-tab',
      refreshToken: 'refresh-from-other-tab',
    })
    expect(mock.history.post).toHaveLength(0)
  })

  it('does not retry stale refresh token after waiting when token was cleared', async () => {
    setAuthTokens({
      accessToken: createJwtWithExpOffset(10),
      refreshToken: 'refresh-old',
    })

    localStorage.setItem(
      REFRESH_LOCK_STORAGE_KEY,
      JSON.stringify(toRefreshLockPayload('refresh-old')),
    )

    setTimeout(() => {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(REFRESH_LOCK_STORAGE_KEY)
    }, 50)

    await expect(forceRefreshAccessToken()).rejects.toThrow(
      'Refresh token changed while waiting for lock',
    )
    expect(mock.history.post).toHaveLength(0)
  })
})
