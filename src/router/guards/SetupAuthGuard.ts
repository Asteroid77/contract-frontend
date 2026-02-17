import { userKeys } from '@/modules/user/application/hooks/useLoadUserInfo'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import type { Router } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import type { SignInResponse, SignInResponseComplete } from '@/modules/user/application/models'
import { userService } from '@/modules/user/application/service'
import axios from 'axios'
import type { AxiosError } from 'axios'
import { captureError } from '@/app/observability'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import { ResponseCode } from '@/modules/shared/application/constants/response-code'
import {
  forceRefreshAccessToken,
  getStoredAccessToken,
  getStoredRefreshToken,
  hasStoredRefreshToken,
  isLogoutInProgress,
} from '@/modules/access/application/token-manager'

const loadCurrentUserInfo = async (accessToken: string): Promise<SignInResponse> => {
  const queryClient = useQueryClient()
  return queryClient.ensureQueryData<SignInResponse, AxiosError<unknown>>({
    queryKey: userKeys.INFO(accessToken),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => userService.getCurrentUserInfo()),
    staleTime: 1000 * 60 * 5,
  })
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

const isAuthError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'isBusinessError' in error) {
    const bizError = error as { isBusinessError?: boolean; code?: number; status?: number }
    if (bizError.isBusinessError) {
      if (bizError.code === ResponseCode.OAUTH2_TOKEN_VERIFY_ERROR ||
          bizError.code === ResponseCode.OAUTH2_TOKEN_EXPIRED) {
        return true
      }
      return bizError.status === 401 || bizError.status === 403
    }
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const payload = error.response?.data as { code?: number } | undefined
    const code = payload?.code
    return status === 401 || status === 403 ||
      code === ResponseCode.OAUTH2_TOKEN_VERIFY_ERROR ||
      code === ResponseCode.OAUTH2_TOKEN_EXPIRED
  }

  return false
}

/**
 * 认证守卫
 *
 * 职责：
 * 1. 检查用户是否已登录
 * 2. 加载用户数据（首次）
 * 3. 处理登录重定向
 *
 * 注意：
 * - 权限检查由 SetupAbilityGuard 负责
 * - 此守卫只负责认证（Authentication），不负责授权（Authorization）
 */
export function setupAuthGuards(router: Router) {
  router.beforeEach(async (to) => {
    const accountStore = useAccountStore()

    // ==============================================
    // 1. 检查路由是否需要认证
    // ==============================================
    const requiresAuth = to.meta.requiresAuth !== false // 默认需要认证

    // ==============================================
    // 2. 预处理 token（优先走 refreshToken）
    // ==============================================
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

    // ==============================================
    // 3. 没有 Token 的情况
    // ==============================================
    if (!token) {
      // 如果路由不需要认证，放行
      if (!requiresAuth) {
        return true
      }
      // 否则，重定向到登录页
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    // ==============================================
    // 4. 有 Token 的情况
    // ==============================================

    // 4.1 已登录用户访问登录页，重定向到 Dashboard
    // 特殊情况：oauth2-callback 需要放行
    if (!requiresAuth && to.name !== 'oauth2-callback') {
      return { name: 'dashboard' }
    }

    // 4.2 数据预加载（首次登录时）
    // 只有在数据还没加载过时才等待，后续路由跳转不会阻塞
    if (!accountStore.isLoadedData) {
      try {
        const data = await loadCurrentUserInfo(token)
        accountStore.login(mergeStoredRefreshToken(data))
      } catch (error) {
        // useRequest 已内置 401 -> refresh -> 重放，守卫不再重复触发 refresh
        captureError(error as Error, {
          source: 'http',
          severity: 'error',
          context: {
            location: 'AuthGuard',
            action: 'loadUserInfo',
          },
        })
        if (isAuthError(error)) {
          accountStore.clearSession()
          return { name: 'login', query: { redirect: to.fullPath } }
        }
        return { name: '500' }
      }
    }

    // ==============================================
    // 5. 权限检查
    // ==============================================

    // 如果路由定义了 CASL ability 规则，跳过旧的权限检查
    // 权限检查由 SetupAbilityGuard 统一处理
    if (to.meta.ability) {
      return true
    }

    // 兼容旧的权限检查方式（permissions/roles）
    const requirePerms = to.meta.permissions
    const requireRoles = to.meta.roles

    // 如果该路由不需要任何权限，直接放行
    if (!requirePerms && !requireRoles) {
      return true
    }

    // 校验权限
    if (requirePerms) {
      const hasAllPerms = requirePerms.every((perm) =>
        accountStore.hasPermission(perm)
      )
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

    // 校验角色
    if (requireRoles) {
      const hasAllRoles = requireRoles.every((role) =>
        accountStore.hasRole(role)
      )
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
