import type { Router } from 'vue-router'
import type { SignInResponse, SignInResponseComplete } from '@/modules/user/application/models'
import type { useAccountStore as useAccountStoreFn } from '@/modules/user/application/stores/useAccountStore'
import type { userService as userServiceInstance } from '@/modules/user/application/service'
import type axios from 'axios'
import type { ResponseCode as ResponseCodeMap } from '@/modules/shared/application/constants/response-code'
import { captureError } from '@/app/observability/lazy'
import {
  forceRefreshAccessToken,
  getStoredAccessToken,
  getStoredRefreshToken,
  hasStoredRefreshToken,
  isLogoutInProgress,
} from '@/modules/access/application/token-manager'
import { enablePostLoginEnhancements } from '@/app/plugins/post-login-enhancements'

type AuthGuardDependencies = {
  useAccountStore: typeof useAccountStoreFn
  userService: typeof userServiceInstance
  axios: typeof axios
  ResponseCode: typeof ResponseCodeMap
}

let authGuardDependenciesPromise: Promise<AuthGuardDependencies> | null = null

const loadAuthGuardDependencies = (): Promise<AuthGuardDependencies> => {
  if (!authGuardDependenciesPromise) {
    authGuardDependenciesPromise = Promise.all([
      import('@/modules/user/application/stores/useAccountStore'),
      import('@/modules/user/application/service'),
      import('axios'),
      import('@/modules/shared/application/constants/response-code'),
    ]).then(([storeModule, userServiceModule, axiosModule, codeModule]) => ({
      useAccountStore: storeModule.useAccountStore,
      userService: userServiceModule.userService,
      axios: axiosModule.default,
      ResponseCode: codeModule.ResponseCode,
    }))
  }

  return authGuardDependenciesPromise
}

const loadCurrentUserInfo = async (deps: AuthGuardDependencies): Promise<SignInResponse> => {
  return deps.userService.getCurrentUserInfo() as Promise<SignInResponse>
}

const mergeStoredRefreshToken = (data: SignInResponse): SignInResponseComplete => {
  if (data.requireTwoFactor) {
    throw new Error('Unexpected two-factor response while loading user info by token')
  }

  if (data.refreshToken) {
    return data
  }

  const storedRefreshToken = getStoredRefreshToken()
  if (!storedRefreshToken) {
    return data
  }

  return {
    ...data,
    refreshToken: storedRefreshToken,
  }
}

const isAuthError = (error: unknown, deps: AuthGuardDependencies): boolean => {
  if (error && typeof error === 'object' && 'isBusinessError' in error) {
    const bizError = error as { isBusinessError?: boolean; code?: number; status?: number }
    if (bizError.isBusinessError) {
      if (
        bizError.code === deps.ResponseCode.OAUTH2_TOKEN_VERIFY_ERROR ||
        bizError.code === deps.ResponseCode.OAUTH2_TOKEN_EXPIRED
      ) {
        return true
      }
      return bizError.status === 401
    }
  }

  if (deps.axios.isAxiosError(error)) {
    const status = error.response?.status
    const payload = error.response?.data as { code?: number } | undefined
    const code = payload?.code
    return (
      status === 401 ||
      code === deps.ResponseCode.OAUTH2_TOKEN_VERIFY_ERROR ||
      code === deps.ResponseCode.OAUTH2_TOKEN_EXPIRED
    )
  }

  return false
}

const ERROR_ROUTE_NAMES = new Set(['403', '404', '500'])

export function setupAuthGuards(router: Router) {
  router.beforeEach(async (to) => {
    const requiresAuth = to.meta.requiresAuth !== false

    let token = getStoredAccessToken()
    const canRefresh = hasStoredRefreshToken()
    const loggingOut = isLogoutInProgress()

    if (!loggingOut && !token && canRefresh && requiresAuth) {
      try {
        await forceRefreshAccessToken()
        token = getStoredAccessToken()
      } catch (error) {
        captureError(error as Error, {
          source: 'http',
          severity: 'warning',
          context: {
            location: 'AuthGuard',
            action: 'refreshWithoutAccessToken',
          },
        })
      }
    }

    if (!token) {
      if (!requiresAuth) {
        return true
      }
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (
      !requiresAuth &&
      to.name !== 'oauth2-callback' &&
      !ERROR_ROUTE_NAMES.has(String(to.name ?? ''))
    ) {
      void enablePostLoginEnhancements().catch(() => undefined)
      return { name: 'dashboard' }
    }

    const deps = await loadAuthGuardDependencies()
    const accountStore = deps.useAccountStore()

    if (!accountStore.isLoadedData) {
      try {
        const data = await loadCurrentUserInfo(deps)
        accountStore.login(mergeStoredRefreshToken(data))
      } catch (error) {
        captureError(error as Error, {
          source: 'http',
          severity: 'error',
          context: {
            location: 'AuthGuard',
            action: 'loadUserInfo',
          },
        })
        if (isAuthError(error, deps)) {
          accountStore.clearSession()
          return { name: 'login', query: { redirect: to.fullPath } }
        }

        if (ERROR_ROUTE_NAMES.has(String(to.name ?? ''))) {
          return true
        }

        return { name: '500' }
      }
    }

    if (to.meta.ability) {
      return true
    }

    const requirePerms = to.meta.permissions

    if (!requirePerms) {
      return true
    }

    if (requirePerms) {
      const hasAllPerms = requirePerms.every((perm) => accountStore.hasPermission(perm))
      if (!hasAllPerms) {
        captureError(new Error('Permission denied'), {
          source: 'permission',
          severity: 'warning',
          context: {
            route: to.name,
            requiredPermissions: requirePerms,
            userPermissions: accountStore.permissionList.map((item) => item.name),
          },
        })
        return { name: '403' }
      }
    }

    void enablePostLoginEnhancements().catch(() => undefined)

    return true
  })
}
