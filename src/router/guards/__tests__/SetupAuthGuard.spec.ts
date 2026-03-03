import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setupAuthGuards } from '@/router/guards/SetupAuthGuard'
import {
  forceRefreshAccessToken,
  getStoredAccessToken,
  getStoredRefreshToken,
  hasStoredRefreshToken,
  isLogoutInProgress,
} from '@/modules/access/application/token-manager'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import { captureError } from '@/app/observability/lazy'
import { enablePostLoginEnhancements } from '@/app/plugins/post-login-enhancements'

vi.mock('@/modules/access/application/token-manager', () => ({
  forceRefreshAccessToken: vi.fn(),
  getStoredAccessToken: vi.fn(),
  getStoredRefreshToken: vi.fn(),
  hasStoredRefreshToken: vi.fn(),
  isLogoutInProgress: vi.fn(),
}))

vi.mock('@/modules/user/application/stores/useAccountStore', () => ({
  useAccountStore: vi.fn(),
}))

vi.mock('@/app/observability/lazy', () => ({
  captureError: vi.fn(),
}))

vi.mock('@/app/plugins/post-login-enhancements', () => ({
  enablePostLoginEnhancements: vi.fn(() => Promise.resolve()),
}))

type GuardTo = {
  name?: string
  fullPath: string
  meta: {
    requiresAuth?: boolean
    ability?: unknown
    permissions?: string[]
    roles?: string[]
  }
}

type GuardHandler = (to: GuardTo) => Promise<unknown>

const createAccountStore = () => ({
  isLoadedData: true,
  isLoggingOut: false,
  login: vi.fn(),
  logout: vi.fn(),
  clearSession: vi.fn(),
  hasPermission: vi.fn((perm: string) => perm === 'perm.read'),
  hasRole: vi.fn((role: string) => role === 'role.admin'),
  permissionList: [{ name: 'perm.read' }],
  roleList: [{ name: 'role.admin' }],
})

const setupGuard = () => {
  const beforeEach = vi.fn()
  const router = {
    beforeEach,
  } as unknown as Parameters<typeof setupAuthGuards>[0]

  setupAuthGuards(router)

  const guard = beforeEach.mock.calls[0][0] as GuardHandler
  return { guard }
}

describe('setupAuthGuards', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const accountStore = createAccountStore()
    vi.mocked(useAccountStore).mockReturnValue(accountStore as never)

    vi.mocked(getStoredAccessToken).mockReturnValue(null)
    vi.mocked(getStoredRefreshToken).mockReturnValue(null)
    vi.mocked(hasStoredRefreshToken).mockReturnValue(false)
    vi.mocked(isLogoutInProgress).mockReturnValue(false)
    vi.mocked(forceRefreshAccessToken).mockResolvedValue({
      accessToken: 'access-refreshed',
      refreshToken: 'refresh-refreshed',
    })
    vi.mocked(enablePostLoginEnhancements).mockResolvedValue()
  })

  it('redirects to login when auth is required and token missing', async () => {
    const { guard } = setupGuard()

    const result = await guard({
      name: 'user-profile',
      fullPath: '/user/profile',
      meta: {},
    })

    expect(result).toEqual({
      name: 'login',
      query: { redirect: '/user/profile' },
    })
  })

  it('allows route when auth is not required and token missing', async () => {
    const { guard } = setupGuard()

    const result = await guard({
      name: 'login',
      fullPath: '/login',
      meta: { requiresAuth: false },
    })

    expect(result).toBe(true)
  })

  it('redirects logged-in user away from unauth route', async () => {
    vi.mocked(getStoredAccessToken).mockReturnValue('access-token')
    const { guard } = setupGuard()

    const result = await guard({
      name: 'login',
      fullPath: '/login',
      meta: { requiresAuth: false },
    })

    expect(result).toEqual({ name: 'dashboard' })
  })

  it('refreshes access token when missing but refresh token exists', async () => {
    const tokens = { value: null as string | null }

    vi.mocked(getStoredAccessToken).mockImplementation(() => tokens.value)
    vi.mocked(hasStoredRefreshToken).mockReturnValue(true)
    vi.mocked(forceRefreshAccessToken).mockImplementation(async () => {
      tokens.value = 'access-refreshed'
      return {
        accessToken: 'access-refreshed',
        refreshToken: 'refresh-refreshed',
      }
    })

    const { guard } = setupGuard()
    const result = await guard({
      name: 'user-profile',
      fullPath: '/user/profile',
      meta: {},
    })

    expect(forceRefreshAccessToken).toHaveBeenCalledTimes(1)
    expect(result).toBe(true)
  })

  it('skips refresh workflow when logout is in progress', async () => {
    vi.mocked(isLogoutInProgress).mockReturnValue(true)
    vi.mocked(getStoredAccessToken).mockReturnValue('access-token')
    vi.mocked(hasStoredRefreshToken).mockReturnValue(true)

    const { guard } = setupGuard()
    const result = await guard({
      name: 'dashboard',
      fullPath: '/dashboard',
      meta: {},
    })

    expect(forceRefreshAccessToken).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('skips legacy permission/role check when ability is defined', async () => {
    vi.mocked(getStoredAccessToken).mockReturnValue('access-token')
    const accountStore = createAccountStore()
    vi.mocked(useAccountStore).mockReturnValue(accountStore as never)

    const { guard } = setupGuard()
    const result = await guard({
      name: 'approval-process-list',
      fullPath: '/approval/process/list',
      meta: {
        ability: {
          action: 'read',
          subject: 'Approval',
        },
        permissions: ['perm.denied'],
        roles: ['role.denied'],
      },
    })

    expect(result).toBe(true)
    expect(accountStore.hasPermission).not.toHaveBeenCalled()
    expect(accountStore.hasRole).not.toHaveBeenCalled()
  })

  it('returns 403 when legacy permissions check fails', async () => {
    vi.mocked(getStoredAccessToken).mockReturnValue('access-token')

    const accountStore = createAccountStore()
    accountStore.hasPermission.mockReturnValue(false)
    vi.mocked(useAccountStore).mockReturnValue(accountStore as never)

    const { guard } = setupGuard()
    const result = await guard({
      name: 'manage-user-list',
      fullPath: '/manage/user/list',
      meta: {
        permissions: ['perm.manage'],
      },
    })

    expect(result).toEqual({ name: '403' })
    expect(captureError).toHaveBeenCalled()
  })

  it('returns 403 when legacy roles check fails', async () => {
    vi.mocked(getStoredAccessToken).mockReturnValue('access-token')

    const accountStore = createAccountStore()
    accountStore.hasRole.mockReturnValue(false)
    vi.mocked(useAccountStore).mockReturnValue(accountStore as never)

    const { guard } = setupGuard()
    const result = await guard({
      name: 'approval-process-list',
      fullPath: '/approval/process/list',
      meta: {
        roles: ['role.reviewer'],
      },
    })

    expect(result).toEqual({ name: '403' })
    expect(captureError).toHaveBeenCalled()
  })
})
