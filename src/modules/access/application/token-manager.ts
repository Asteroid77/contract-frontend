import type { AxiosResponse } from 'axios'
import { STORAGE_KEYS } from '@/constants/storage'
import { apiClient } from '@/app/infrastructure/request/http-client'
import type { RFC7807Response } from '@/modules/shared/domain/response'
import { AUTH_ENDPOINTS } from '../infrastructure/auth-endpoints'

const EXPIRING_SOON_THRESHOLD_SECONDS = 5 * 60

interface RefreshTokenResponseDTO {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface AuthTokenPair {
  accessToken: string
  refreshToken: string
}

let refreshTokenPromise: Promise<AuthTokenPair> | null = null

export const getStoredAccessToken = (): string | null =>
  localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

export const getStoredRefreshToken = (): string | null =>
  localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

export const hasStoredRefreshToken = (): boolean =>
  Boolean(getStoredRefreshToken())

export const setAuthTokens = (tokens: { accessToken: string; refreshToken?: string }): void => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken)

  if (tokens.refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
    return
  }

  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
}

export const clearAuthTokens = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
}

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }

  const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')

  if (typeof atob !== 'function') {
    return null
  }

  try {
    const decoded = atob(padded)
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

const getJwtExpireAt = (token: string): number | null => {
  const payload = decodeJwtPayload(token)
  const exp = payload?.exp

  if (typeof exp !== 'number' || !Number.isFinite(exp)) {
    return null
  }

  return exp * 1000
}

export const isAccessTokenExpiringSoon = (
  thresholdSeconds: number = EXPIRING_SOON_THRESHOLD_SECONDS,
): boolean => {
  const accessToken = getStoredAccessToken()
  if (!accessToken) {
    return false
  }

  const expireAt = getJwtExpireAt(accessToken)
  if (!expireAt) {
    return false
  }

  const thresholdMillis = thresholdSeconds * 1000
  return expireAt - Date.now() <= thresholdMillis
}

const requestRefreshToken = async (refreshToken: string): Promise<AuthTokenPair> => {
  const response = await apiClient.post<
    RFC7807Response<RefreshTokenResponseDTO>,
    AxiosResponse<RFC7807Response<RefreshTokenResponseDTO>>,
    { refreshToken: string }
  >(AUTH_ENDPOINTS.TOKEN_REFRESH, {
    refreshToken,
  })

  const payload = response.data.data

  if (!payload?.accessToken || !payload?.refreshToken) {
    throw new Error('Refresh token response missing required fields')
  }

  const nextTokens: AuthTokenPair = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  }

  setAuthTokens(nextTokens)
  return nextTokens
}

export const forceRefreshAccessToken = async (): Promise<AuthTokenPair> => {
  if (refreshTokenPromise) {
    return refreshTokenPromise
  }

  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) {
    throw new Error('Refresh token is missing')
  }

  refreshTokenPromise = requestRefreshToken(refreshToken)
    .catch((error) => {
      clearAuthTokens()
      throw error
    })
    .finally(() => {
      refreshTokenPromise = null
    })

  return refreshTokenPromise
}

export const refreshAccessTokenIfNeeded = async (
  thresholdSeconds: number = EXPIRING_SOON_THRESHOLD_SECONDS,
): Promise<AuthTokenPair | null> => {
  if (!getStoredAccessToken() || !hasStoredRefreshToken()) {
    return null
  }

  if (!isAccessTokenExpiringSoon(thresholdSeconds)) {
    return null
  }

  return forceRefreshAccessToken()
}
