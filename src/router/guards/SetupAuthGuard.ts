import type { Router } from 'vue-router'
import type { SignInResponse, SignInResponseComplete } from '@/modules/user/application/models'
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
  useAccountStore: typeof import('@/modules/user/application/stores/useAccountStore').useAccountStore
  useQueryClient: typeof import('@tanstack/vue-query').useQueryClient
  userKeys: typeof import('@/modules/user/application/hooks/useLoadUserInfo').userKeys
  userService: typeof import('@/modules/user/application/service').userService
  axios: typeof import('axios').default
  withQueryRequestContext: typeof import('@/app/infrastructure/query/query-request-context').withQueryRequestContext
  ResponseCode: typeof import('@/modules/shared/application/constants/response-code').ResponseCode
}

let authGuardDependenciesPromise: Promise<AuthGuardDependencies> | null = null

const loadAuthGuardDependencies = (): Promise<AuthGuardDependencies> => {
  if (!authGuardDependenciesPromise) {
    authGuardDependenciesPromise = Promise.all([
      import('@/modules/user/application/stores/useAccountStore'),
      import('@tanstack/vue-query'),
      import('@/modules/user/application/hooks/useLoadUserInfo'),
      import('@/modules/user/application/service'),
      import('axios'),
      import('@/app/infrastructure/query/query-request-context'),
      import('@/modules/shared/application/constants/response-code'),
    ]).then(
      ([
        storeModule,
        queryModule,
        userInfoModule,
        userServiceModule,
        axiosModule,
        contextModule,
        codeModule,
      ]) => ({
        useAccountStore: storeModule.useAccountStore,
        useQueryClient: queryModule.useQueryClient,
        userKeys: userInfoModule.userKeys,
        userService: userServiceModule.userService,
        axios: axiosModule.default,
        withQueryRequestContext: contextModule.withQueryRequestContext,
        ResponseCode: codeModule.ResponseCode,
      }),
    )
  }

  return authGuardDependenciesPromise
}

const loadCurrentUserInfo = async (
  accessToken: string,
  deps: AuthGuardDependencies,
): Promise<SignInResponse> => {
  const queryClient = deps.useQueryClient()

  return queryClient.ensureQueryData({
    queryKey: deps.userKeys.INFO(accessToken),
    queryFn: (ctx) =>
      deps.withQueryRequestContext(ctx.queryKey, ctx, () => deps.userService.getCurrentUserInfo()),
    staleTime: 1000 * 60 * 5,
  }) as Promise<SignInResponse>
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
      return bizError.status === 401 || bizError.status === 403
    }
  }

  if (deps.axios.isAxiosError(error)) {
    const status = error.response?.status
    const payload = error.response?.data as { code?: number } | undefined
    const code = payload?.code
    return (
      status === 401 ||
      status === 403 ||
      code === deps.ResponseCode.OAUTH2_TOKEN_VERIFY_ERROR ||
      code === deps.ResponseCode.OAUTH2_TOKEN_EXPIRED
    )
  }

  return false
}

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

    if (!requiresAuth && to.name !== 'oauth2-callback') {
      void enablePostLoginEnhancements().catch(() => undefined)
      return { name: 'dashboard' }
    }

    const deps = await loadAuthGuardDependencies()
    const accountStore = deps.useAccountStore()

    void enablePostLoginEnhancements().catch(() => undefined)

    if (!accountStore.isLoadedData) {
      try {
        const data = await loadCurrentUserInfo(token, deps)
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
        return { name: '500' }
      }
    }

    if (to.meta.ability) {
      return true
    }

    const requirePerms = to.meta.permissions
    const requireRoles = to.meta.roles

    if (!requirePerms && !requireRoles) {
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

    if (requireRoles) {
      const hasAllRoles = requireRoles.every((role) => accountStore.hasRole(role))
      if (!hasAllRoles) {
        captureError(new Error('Role denied'), {
          source: 'permission',
          severity: 'warning',
          context: {
            route: to.name,
            requiredRoles: requireRoles,
            userRoles: accountStore.roleList.map((item) => item.name),
          },
        })
        return { name: '403' }
      }
    }

    return true
  })
}
