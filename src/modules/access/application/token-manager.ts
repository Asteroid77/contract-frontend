import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { STORAGE_KEYS } from '@/constants/storage'
import { apiClient } from '@/app/infrastructure/request/http-client'
import type { RFC7807Response } from '@/modules/shared/domain/response'
import { AUTH_ENDPOINTS } from '../infrastructure/auth-endpoints'
import { ResponseCode } from '@/modules/shared/application/constants/response-code'

const EXPIRING_SOON_THRESHOLD_SECONDS = 5 * 60
const PROACTIVE_REFRESH_MAX_LEAD_SECONDS = 60
const PROACTIVE_REFRESH_MIN_LEAD_SECONDS = 5
const PROACTIVE_REFRESH_LEAD_RATIO = 0.2
const PROACTIVE_REFRESH_MIN_DELAY_MS = 5000
export const REFRESH_LOCK_STORAGE_KEY = 'AUTH_REFRESH_LOCK'
const REFRESH_LOCK_TTL_MS = 15000
const REFRESH_LOCK_WAIT_TIMEOUT_MS = 16000
const REFRESH_LOCK_POLL_INTERVAL_MS = 120
const REFRESH_FAILURE_COOLDOWN_MS = 1500
const REFRESH_FAILURE_MAX_COOLDOWN_MS = 12000
const REFRESH_FAILURE_WINDOW_MS = 30000
const REFRESH_FAILURE_STATE_STORAGE_KEY = 'AUTH_REFRESH_FAILURE_STATE'
const REFRESH_SUPPRESSED_DURING_LOGOUT_ERROR = 'Refresh suppressed during logout'

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

export interface AuthTokensInput {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

export const AUTH_SESSION_CLEARED_EVENT = 'auth:session-cleared'

let refreshTokenPromise: Promise<AuthTokenPair> | null = null
let logoutInProgress = false
let refreshBlockedUntil = 0
let proactiveRefreshTimer: ReturnType<typeof setTimeout> | null = null
let authTokenLifecycleInitialized = false
const refreshLockOwnerId = createRefreshLockOwnerId()

interface RefreshLockPayload {
  ownerId: string
  refreshToken: string
  expireAt: number
}

interface RefreshFailureState {
  refreshToken: string
  failureCount: number
  lastFailedAt: number
  blockedUntil: number
}

export const getStoredAccessToken = (): string | null =>
  localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

export const getStoredRefreshToken = (): string | null =>
  localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)

export const hasStoredRefreshToken = (): boolean =>
  Boolean(getStoredRefreshToken())

export const getStoredAccessTokenExpiresAt = (): number | null => {
  const raw = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT)
  if (!raw) {
    return null
  }

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

const clearProactiveRefreshTimer = (): void => {
  if (!proactiveRefreshTimer) {
    return
  }
  clearTimeout(proactiveRefreshTimer)
  proactiveRefreshTimer = null
}

const computeProactiveLeadSeconds = (expiresInSeconds: number): number => {
  const dynamicLead = Math.floor(expiresInSeconds * PROACTIVE_REFRESH_LEAD_RATIO)
  return Math.min(
    PROACTIVE_REFRESH_MAX_LEAD_SECONDS,
    Math.max(PROACTIVE_REFRESH_MIN_LEAD_SECONDS, dynamicLead),
  )
}

const computeProactiveRefreshDelayMs = (expiresAt: number): number => {
  const remainingMs = expiresAt - Date.now()
  const remainingSeconds = Math.floor(remainingMs / 1000)
  const leadSeconds = computeProactiveLeadSeconds(Math.max(remainingSeconds, 0))
  return remainingMs - leadSeconds * 1000
}

const scheduleProactiveRefresh = (): void => {
  clearProactiveRefreshTimer()

  const refreshToken = getStoredRefreshToken()
  const expiresAt = getAccessTokenExpireAt()
  if (!refreshToken || !expiresAt || logoutInProgress) {
    return
  }

  const delayMs = computeProactiveRefreshDelayMs(expiresAt)
  if (delayMs < PROACTIVE_REFRESH_MIN_DELAY_MS) {
    return
  }

  proactiveRefreshTimer = setTimeout(() => {
    proactiveRefreshTimer = null
    forceRefreshAccessToken().catch(() => {
      // Keep proactive refresh alive after transient failures.
      if (!logoutInProgress) {
        scheduleProactiveRefresh()
      }
    })
  }, delayMs)
}

const onAuthStorageChanged = (event: StorageEvent): void => {
  if (event.storageArea !== localStorage) {
    return
  }

  if (event.key && ![
    STORAGE_KEYS.ACCESS_TOKEN,
    STORAGE_KEYS.REFRESH_TOKEN,
    STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT,
  ].includes(event.key)) {
    return
  }

  if (!getStoredAccessToken() || !getStoredRefreshToken()) {
    clearProactiveRefreshTimer()
    return
  }

  scheduleProactiveRefresh()
}

export const initAuthTokenLifecycle = (): void => {
  if (typeof window === 'undefined' || authTokenLifecycleInitialized) {
    return
  }

  authTokenLifecycleInitialized = true
  window.addEventListener('storage', onAuthStorageChanged)
  scheduleProactiveRefresh()
}

export const setAuthTokens = (tokens: AuthTokensInput): void => {
  refreshBlockedUntil = 0
  clearRefreshFailureState()

  const previousAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken)

  if (tokens.expiresIn && tokens.expiresIn > 0) {
    const expiresAt = Date.now() + tokens.expiresIn * 1000
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT, String(expiresAt))
  } else if (previousAccessToken !== tokens.accessToken) {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT)
  }

  if (tokens.refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
  } else {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  }

  scheduleProactiveRefresh()
}

export const clearAuthTokens = (): void => {
  const hadAccessToken = Boolean(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN))
  const hadRefreshToken = Boolean(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN))

  clearProactiveRefreshTimer()
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN_EXPIRES_AT)
  releaseOwnedRefreshLock()
  refreshBlockedUntil = 0
  clearRefreshFailureState()

  if ((hadAccessToken || hadRefreshToken) && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_SESSION_CLEARED_EVENT))
  }
}

export const setLogoutInProgress = (inProgress: boolean): void => {
  logoutInProgress = inProgress

  if (inProgress) {
    clearProactiveRefreshTimer()
    return
  }

  scheduleProactiveRefresh()
}

export const isLogoutInProgress = (): boolean => logoutInProgress

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

function createRefreshLockOwnerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function parseRefreshLockPayload(raw: string | null): RefreshLockPayload | null {
  if (!raw) {
    return null
  }
  try {
    const payload = JSON.parse(raw) as Partial<RefreshLockPayload>
    if (!payload || typeof payload !== 'object') {
      return null
    }
    if (typeof payload.ownerId !== 'string'
      || typeof payload.refreshToken !== 'string'
      || typeof payload.expireAt !== 'number') {
      return null
    }
    return payload as RefreshLockPayload
  } catch {
    return null
  }
}

function readRefreshLock(): RefreshLockPayload | null {
  const payload = parseRefreshLockPayload(localStorage.getItem(REFRESH_LOCK_STORAGE_KEY))
  if (!payload) {
    localStorage.removeItem(REFRESH_LOCK_STORAGE_KEY)
    return null
  }

  if (payload.expireAt <= Date.now()) {
    localStorage.removeItem(REFRESH_LOCK_STORAGE_KEY)
    return null
  }

  return payload
}

function tryAcquireRefreshLock(refreshToken: string): RefreshLockPayload | null {
  const existing = readRefreshLock()
  if (
    existing &&
    existing.refreshToken === refreshToken &&
    existing.ownerId !== refreshLockOwnerId
  ) {
    return null
  }

  const payload: RefreshLockPayload = {
    ownerId: refreshLockOwnerId,
    refreshToken,
    expireAt: Date.now() + REFRESH_LOCK_TTL_MS,
  }
  localStorage.setItem(REFRESH_LOCK_STORAGE_KEY, JSON.stringify(payload))

  const current = readRefreshLock()
  if (!current) {
    return null
  }
  if (current.ownerId !== refreshLockOwnerId) {
    return null
  }
  if (current.refreshToken !== refreshToken) {
    return null
  }
  return current
}

function releaseRefreshLock(lockPayload: RefreshLockPayload | null): void {
  if (!lockPayload) {
    return
  }
  const current = readRefreshLock()
  if (!current) {
    return
  }
  if (current.ownerId === lockPayload.ownerId && current.refreshToken === lockPayload.refreshToken) {
    localStorage.removeItem(REFRESH_LOCK_STORAGE_KEY)
  }
}

function releaseOwnedRefreshLock(): void {
  const current = readRefreshLock()
  if (current && current.ownerId === refreshLockOwnerId) {
    localStorage.removeItem(REFRESH_LOCK_STORAGE_KEY)
  }
}

function parseRefreshFailureState(raw: string | null): RefreshFailureState | null {
  if (!raw) {
    return null
  }

  try {
    const payload = JSON.parse(raw) as Partial<RefreshFailureState>
    if (!payload || typeof payload !== 'object') {
      return null
    }

    if (typeof payload.refreshToken !== 'string'
      || typeof payload.failureCount !== 'number'
      || typeof payload.lastFailedAt !== 'number'
      || typeof payload.blockedUntil !== 'number') {
      return null
    }

    return payload as RefreshFailureState
  } catch {
    return null
  }
}

function readRefreshFailureState(): RefreshFailureState | null {
  const state = parseRefreshFailureState(localStorage.getItem(REFRESH_FAILURE_STATE_STORAGE_KEY))
  if (!state) {
    localStorage.removeItem(REFRESH_FAILURE_STATE_STORAGE_KEY)
    return null
  }
  return state
}

function clearRefreshFailureState(): void {
  localStorage.removeItem(REFRESH_FAILURE_STATE_STORAGE_KEY)
}

function getRefreshBlockedUntil(refreshToken: string): number {
  const state = readRefreshFailureState()
  if (!state || state.refreshToken !== refreshToken) {
    refreshBlockedUntil = 0
    return 0
  }

  if (state.blockedUntil <= Date.now()) {
    clearRefreshFailureState()
    refreshBlockedUntil = 0
    return 0
  }

  return Math.max(refreshBlockedUntil, state.blockedUntil)
}

function markRefreshFailure(refreshToken: string): void {
  const now = Date.now()
  const currentState = readRefreshFailureState()
  const inWindow = Boolean(
    currentState &&
      currentState.refreshToken === refreshToken &&
      now - currentState.lastFailedAt <= REFRESH_FAILURE_WINDOW_MS,
  )

  const failureCount = inWindow && currentState ? currentState.failureCount + 1 : 1
  const cooldownMs = Math.min(
    REFRESH_FAILURE_COOLDOWN_MS * Math.pow(2, failureCount - 1),
    REFRESH_FAILURE_MAX_COOLDOWN_MS,
  )
  const blockedUntil = now + cooldownMs

  refreshBlockedUntil = blockedUntil
  const state: RefreshFailureState = {
    refreshToken,
    failureCount,
    lastFailedAt: now,
    blockedUntil,
  }
  localStorage.setItem(REFRESH_FAILURE_STATE_STORAGE_KEY, JSON.stringify(state))
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

const getAccessTokenExpireAt = (): number | null => {
  const expiresAtFromStorage = getStoredAccessTokenExpiresAt()
  if (expiresAtFromStorage) {
    return expiresAtFromStorage
  }

  const accessToken = getStoredAccessToken()
  if (!accessToken) {
    return null
  }

  return getJwtExpireAt(accessToken)
}

export const isAccessTokenExpiringSoon = (
  thresholdSeconds: number = EXPIRING_SOON_THRESHOLD_SECONDS,
): boolean => {
  const expireAt = getAccessTokenExpireAt()
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
  >(
    AUTH_ENDPOINTS.TOKEN_REFRESH,
    {
      refreshToken,
    },
    {
      withCredentials: true,
    },
  )

  const payload = response.data.data

  if (!payload?.accessToken || !payload?.refreshToken) {
    throw new Error('Refresh token response missing required fields')
  }

  const nextTokens: AuthTokenPair = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
  }

  if (logoutInProgress) {
    throw new Error(REFRESH_SUPPRESSED_DURING_LOGOUT_ERROR)
  }

  setAuthTokens({
    ...nextTokens,
    expiresIn: payload.expiresIn,
  })
  return nextTokens
}

const recoverTokensFromConcurrentRefresh = (
  currentRefreshToken: string,
): AuthTokenPair | null => {
  const latestAccessToken = getStoredAccessToken()
  const latestRefreshToken = getStoredRefreshToken()

  if (!latestAccessToken || !latestRefreshToken) {
    return null
  }

  if (latestRefreshToken === currentRefreshToken) {
    return null
  }

  return {
    accessToken: latestAccessToken,
    refreshToken: latestRefreshToken,
  }
}

const waitForRefreshByOtherTab = async (
  currentRefreshToken: string,
): Promise<AuthTokenPair | null> => {
  const deadline = Date.now() + REFRESH_LOCK_WAIT_TIMEOUT_MS

  while (Date.now() < deadline) {
    if (Date.now() < getRefreshBlockedUntil(currentRefreshToken)) {
      throw new Error('Refresh temporarily blocked after recent failure')
    }

    const recovered = recoverTokensFromConcurrentRefresh(currentRefreshToken)
    if (recovered) {
      return recovered
    }

    const latestRefreshToken = getStoredRefreshToken()
    if (!latestRefreshToken || latestRefreshToken !== currentRefreshToken) {
      return null
    }

    const lock = readRefreshLock()
    if (!lock || lock.refreshToken !== currentRefreshToken) {
      break
    }

    await sleep(REFRESH_LOCK_POLL_INTERVAL_MS)
  }

  return recoverTokensFromConcurrentRefresh(currentRefreshToken)
}

const isRefreshSuppressedDuringLogoutError = (error: unknown): boolean =>
  error instanceof Error && error.message === REFRESH_SUPPRESSED_DURING_LOGOUT_ERROR

const shouldClearTokensAfterRefreshFailure = (error: unknown): boolean => {
  if (!axios.isAxiosError(error) || !error.response) {
    return false
  }

  const payload = error.response.data as RFC7807Response | undefined
  const status = error.response.status ?? payload?.status
  const code = payload?.code

  if (status === 401 || status === 403) {
    return true
  }

  return code === ResponseCode.OAUTH2_TOKEN_VERIFY_ERROR ||
    code === ResponseCode.OAUTH2_TOKEN_EXPIRED
}

export const forceRefreshAccessToken = async (): Promise<AuthTokenPair> => {
  if (logoutInProgress) {
    throw new Error(REFRESH_SUPPRESSED_DURING_LOGOUT_ERROR)
  }

  if (refreshTokenPromise) {
    return refreshTokenPromise
  }

  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) {
    throw new Error('Refresh token is missing')
  }

  if (Date.now() < getRefreshBlockedUntil(refreshToken)) {
    throw new Error('Refresh temporarily blocked after recent failure')
  }

  refreshTokenPromise = (async () => {
    let lock = tryAcquireRefreshLock(refreshToken)
    if (lock) {
      try {
        return await requestRefreshToken(refreshToken)
      } finally {
        releaseRefreshLock(lock)
      }
    }

    const waited = await waitForRefreshByOtherTab(refreshToken)
    if (waited) {
      return waited
    }

    const latestRefreshToken = getStoredRefreshToken()
    if (!latestRefreshToken || latestRefreshToken !== refreshToken) {
      throw new Error('Refresh token changed while waiting for lock')
    }

    lock = tryAcquireRefreshLock(refreshToken)
    if (!lock) {
      throw new Error('Refresh lock acquisition failed')
    }

    try {
      return await requestRefreshToken(refreshToken)
    } finally {
      releaseRefreshLock(lock)
    }
  })()
    .catch((error) => {
      const recoveredTokens = recoverTokensFromConcurrentRefresh(refreshToken)
      if (recoveredTokens) {
        return recoveredTokens
      }

      const latestRefreshToken = getStoredRefreshToken()
      const stillUsingSameRefreshToken = latestRefreshToken === refreshToken

      if (stillUsingSameRefreshToken && shouldClearTokensAfterRefreshFailure(error)) {
        clearAuthTokens()
        throw error
      }

      if (stillUsingSameRefreshToken && !isRefreshSuppressedDuringLogoutError(error)) {
        markRefreshFailure(refreshToken)
      }

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
  if (logoutInProgress) {
    return null
  }

  if (!getStoredAccessToken() || !hasStoredRefreshToken()) {
    return null
  }

  if (!isAccessTokenExpiringSoon(thresholdSeconds)) {
    return null
  }

  return forceRefreshAccessToken()
}
