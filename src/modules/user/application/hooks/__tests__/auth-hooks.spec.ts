import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMutation } from '@tanstack/vue-query'
import { useChangePassword } from '@/modules/user/application/hooks/useChangePassword'
import { useLogin } from '@/modules/user/application/hooks/useLogin'
import { useRegister } from '@/modules/user/application/hooks/useRegister'
import { usePasswordRecovery } from '@/modules/user/application/hooks/usePassword'
import { useOauth2AuthorizationUrl } from '@/modules/user/application/hooks/useOauth2AuthorizationUrl'
import { userService } from '@/modules/user/application/service'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore.ts'
import router from '@/router'
import { buildOauth2AuthorizationUrl } from '@/modules/user/infrastructure/oauth-endpoints'

const { loginSpy, pushSpy } = vi.hoisted(() => ({
  loginSpy: vi.fn(),
  pushSpy: vi.fn(),
}))

vi.mock('@tanstack/vue-query', () => ({
  useMutation: vi.fn((options) => options),
}))

vi.mock('@/modules/user/application/service', () => ({
  userService: {
    changePassword: vi.fn(),
    login: vi.fn(),
    getUserInfoByToken: vi.fn(),
    register: vi.fn(),
    passwordRecovery: vi.fn(),
  },
}))

vi.mock('@/modules/user/application/stores/useAccountStore.ts', () => ({
  useAccountStore: vi.fn(() => ({
    login: loginSpy,
  })),
}))

vi.mock('@/router', () => ({
  default: {
    push: pushSpy,
  },
}))

vi.mock('@/modules/user/infrastructure/oauth-endpoints', () => ({
  buildOauth2AuthorizationUrl: vi.fn((platform: string) => `https://oauth.example/${platform}`),
}))

describe('user auth-related hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(window as any).$message = { success: vi.fn() }
    ;(window as any).open = vi.fn(() => null)
  })

  it('useChangePassword delegates mutationFn to userService.changePassword', async () => {
    vi.mocked(userService.changePassword).mockResolvedValue(true)

    useChangePassword()
    const options = vi.mocked(useMutation).mock.calls[0][0] as any

    const payload = {
      oldPassword: 'oldPwd',
      newPassword: 'newPwd',
    }

    const result = await options.mutationFn(payload)

    expect(userService.changePassword).toHaveBeenCalledWith(payload)
    expect(result).toBe(true)
  })

  it('useLogin mutationFn uses local login when mode is local', async () => {
    vi.mocked(userService.login).mockResolvedValue({ token: 'local-token' } as never)

    useLogin()
    const options = vi.mocked(useMutation).mock.calls[0][0] as any

    const payload = {
      mode: 'local',
      data: {
        phone: '13800138000',
        password: 'pwd',
        captchaKey: 'k',
        captcha: 'c',
      },
    }

    await options.mutationFn(payload)

    expect(userService.login).toHaveBeenCalledWith(payload.data)
    expect(userService.getUserInfoByToken).not.toHaveBeenCalled()
  })

  it('useLogin mutationFn uses getUserInfoByToken when mode is oauth2', async () => {
    vi.mocked(userService.getUserInfoByToken).mockResolvedValue({ token: 'oauth-token' } as never)

    useLogin()
    const options = vi.mocked(useMutation).mock.calls[0][0] as any

    const payload = {
      mode: 'oauth2',
      token: 'oauth-token',
    }

    await options.mutationFn(payload)

    expect(userService.getUserInfoByToken).toHaveBeenCalledWith('oauth-token')
    expect(userService.login).not.toHaveBeenCalled()
  })

  it('useLogin onSuccess writes account and redirects to given target', async () => {
    useLogin()
    const options = vi.mocked(useMutation).mock.calls[0][0] as any

    const signInResponse = {
      token: 'token-a',
      refreshToken: 'refresh-a',
      user: {
        id: 1,
        name: 'Tester',
        phone: '13800138000',
        active: '1',
        isDeleted: 0,
        platform: 'NATIVE',
      },
      profile: null,
      permissionList: [],
      roleList: [],
    }

    await options.onSuccess(signInResponse, {
      mode: 'local',
      data: {
        phone: '13800138000',
        password: 'pwd',
        captchaKey: 'k',
        captcha: 'c',
      },
      redirect: { name: 'profile' },
    })

    expect(useAccountStore).toHaveBeenCalledTimes(1)
    expect(loginSpy).toHaveBeenCalledWith(signInResponse)
    expect(router.push).toHaveBeenCalledWith({ name: 'profile' })
  })

  it('useLogin onSuccess redirects dashboard when redirect is missing', async () => {
    useLogin()
    const options = vi.mocked(useMutation).mock.calls[0][0] as any

    await options.onSuccess(
      {
        token: 'token-a',
        user: {
          id: 1,
          name: 'Tester',
          phone: '13800138000',
          active: '1',
          isDeleted: 0,
          platform: 'NATIVE',
        },
        profile: null,
        permissionList: [],
        roleList: [],
      },
      {
        mode: 'oauth2',
        token: 'oauth-token',
      },
    )

    expect(router.push).toHaveBeenCalledWith({ name: 'dashboard' })
  })

  it('useRegister delegates mutation and onSuccess logs in minimal user then redirects login', async () => {
    vi.mocked(userService.register).mockResolvedValue({
      userId: 3,
      name: 'New User',
      phone: '13900000000',
    } as never)

    useRegister()
    const options = vi.mocked(useMutation).mock.calls[0][0] as any

    const payload = {
      phone: '13900000000',
      password: 'pwd',
      code: '6666',
      bizId: 'biz-1',
    }

    await options.mutationFn(payload)
    expect(userService.register).toHaveBeenCalledWith(payload)

    options.onSuccess({
      userId: 3,
      name: 'New User',
      phone: '13900000000',
    })

    expect(loginSpy).toHaveBeenCalledWith({
      user: {
        id: 3,
        name: 'New User',
        phone: '13900000000',
        active: '1',
        isDeleted: 0,
        platform: 'NATIVE',
      },
      profile: null,
      token: '',
      permissionList: [],
      roleList: [],
    })
    expect(router.push).toHaveBeenCalledWith({ name: 'login' })
  })

  it('usePasswordRecovery delegates mutation and onSuccess shows message then redirects', async () => {
    vi.mocked(userService.passwordRecovery).mockResolvedValue(true as never)

    usePasswordRecovery()
    const options = vi.mocked(useMutation).mock.calls[0][0] as any

    const payload = {
      phone: '13900000000',
      password: 'pwd',
      code: '1234',
      bizId: 'biz-2',
    }

    await options.mutationFn(payload)
    expect(userService.passwordRecovery).toHaveBeenCalledWith(payload)

    options.onSuccess()
    expect((window as any).$message.success).toHaveBeenCalledWith('重置密码成功，请重新登录')
    expect(router.push).toHaveBeenCalledWith({ name: 'login' })
  })

  it('useOauth2AuthorizationUrl opens centered popup with built url', () => {
    const openedWindow = { closed: false }
    ;(window as any).open = vi.fn(() => openedWindow)

    const result = useOauth2AuthorizationUrl('github')

    expect(buildOauth2AuthorizationUrl).toHaveBeenCalledWith('github')
    expect((window as any).open).toHaveBeenCalledTimes(1)

    const [url, target, features] = (window as any).open.mock.calls[0]
    expect(url).toBe('https://oauth.example/github')
    expect(target).toBe('Oauth2Auth')
    expect(features).toContain('width=550')
    expect(features).toContain('height=650')
    expect(features).toContain('resizable=yes')
    expect(features).toContain('scrollbars=yes')
    expect(result).toBe(openedWindow)
  })
})
