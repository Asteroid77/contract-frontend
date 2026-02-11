import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import dexie from '@/app/infrastructure/storage/dexie'
import { STORAGE_KEYS } from '@/constants/storage'
import { updateAbility, clearAbility } from '@/modules/access/application/ability'
import { clearAuthTokens, setAuthTokens } from '@/modules/access/application/token-manager'

vi.mock('@/app/infrastructure/storage/dexie', () => ({
  default: {
    userinfo: {
      add: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/modules/access/application/ability', () => ({
  updateAbility: vi.fn(),
  clearAbility: vi.fn(),
}))

vi.mock('@/modules/access/application/token-manager', () => ({
  setAuthTokens: vi.fn(),
  clearAuthTokens: vi.fn(),
}))

const buildSignInResponse = () => ({
  user: {
    id: 10,
    name: 'Alice',
    phone: '13800138000',
    active: '1' as const,
    isDeleted: 0,
    platform: 'NATIVE' as const,
  },
  profile: {
    id: 1,
    registerType: 1 as const,
    name: 'Alice Corp',
    bankName: 'Bank',
    bankAccount: '62220000',
    pca: 'Shanghai',
    identity: 'ID-1',
    discriminator: 1,
    userId: 10,
    createdTime: '2026-02-10T10:00:00+08:00',
    updatedTime: '2026-02-10T10:00:00+08:00',
  },
  token: 'access-a',
  refreshToken: 'refresh-a',
  permissionList: [
    {
      id: 1,
      name: 'user:read',
      description: 'read user',
    },
  ],
  roleList: [
    {
      id: 1,
      name: 'admin',
      description: 'admin role',
      permissions: [],
    },
  ],
})

describe('useAccountStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('initializes token and refreshToken from localStorage', () => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'access-from-local')
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-from-local')

    const store = useAccountStore()

    expect(store.token).toBe('access-from-local')
    expect(store.refreshToken).toBe('refresh-from-local')
    expect(store.isAuth).toBe(true)
  })

  it('updateTokens updates state and delegates to setAuthTokens', () => {
    const store = useAccountStore()

    store.updateTokens('access-1', 'refresh-1')

    expect(store.token).toBe('access-1')
    expect(store.refreshToken).toBe('refresh-1')
    expect(setAuthTokens).toHaveBeenLastCalledWith({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    })

    store.updateTokens('access-2')

    expect(store.token).toBe('access-2')
    expect(store.refreshToken).toBe(null)
    expect(setAuthTokens).toHaveBeenLastCalledWith({
      accessToken: 'access-2',
      refreshToken: undefined,
    })
  })

  it('login writes user state, tokens and side effects', () => {
    const store = useAccountStore()
    const response = buildSignInResponse()

    store.login(response)

    expect(store.token).toBe('access-a')
    expect(store.refreshToken).toBe('refresh-a')
    expect(store.user).toEqual(response.user)
    expect(store.profile).toEqual(response.profile)
    expect(store.permissionList).toEqual(response.permissionList)
    expect(store.roleList).toEqual(response.roleList)
    expect(store.account).toEqual(response)
    expect(store.isLoadedData).toBe(true)

    expect(setAuthTokens).toHaveBeenCalledWith({
      accessToken: 'access-a',
      refreshToken: 'refresh-a',
    })
    expect(dexie.userinfo.add).toHaveBeenCalledWith(response)
    expect(updateAbility).toHaveBeenCalledWith(response.permissionList, response.roleList)
  })

  it('hasRole/hasPermission/isOwner reflect current state', () => {
    const store = useAccountStore()
    store.login(buildSignInResponse())

    expect(store.hasRole('admin')).toBe(true)
    expect(store.hasRole('auditor')).toBe(false)

    expect(store.hasPermission('user:read')).toBe(true)
    expect(store.hasPermission('user:write')).toBe(false)

    expect(store.isOwner(undefined)).toBe(false)
    expect(store.isOwner(99)).toBe(false)
    expect(store.isOwner(10)).toBe(true)
  })

  it('logout clears ability, tokens and resets to defaults', () => {
    const store = useAccountStore()
    store.login(buildSignInResponse())

    store.logout()

    expect(clearAbility).toHaveBeenCalledTimes(1)
    expect(dexie.userinfo.delete).toHaveBeenCalledWith('access-a')
    expect(clearAuthTokens).toHaveBeenCalledTimes(1)

    expect(store.token).toBe(null)
    expect(store.refreshToken).toBe(null)
    expect(store.isAuth).toBe(false)
    expect(store.isLoadedData).toBe(false)
    expect(store.user.id).toBe(0)
    expect(store.profile).toBe(null)
    expect(store.permissionList).toEqual([])
    expect(store.roleList).toEqual([])
    expect(store.account?.token).toBe('')
    expect(store.account?.refreshToken).toBeUndefined()
  })
})
