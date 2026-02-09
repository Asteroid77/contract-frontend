import { userKeys } from '@/modules/user/application/hooks/useLoadUserInfo'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import type { Router } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import type { SignInResponse } from '@/modules/user/application/models'
import { userService } from '@/modules/user/application/service'
import type { AxiosError } from 'axios'
import { captureError } from '@/app/observability'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import {
  forceRefreshAccessToken,
  getStoredAccessToken,
  hasStoredRefreshToken,
  refreshAccessTokenIfNeeded,
} from '@/modules/access/application/token-manager'

const loadUserInfoByToken = async (token: string): Promise<SignInResponse> => {
  const queryClient = useQueryClient()
  return queryClient.ensureQueryData<SignInResponse, AxiosError<unknown>>({
    queryKey: userKeys.INFO(token),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => userService.getUserInfoByToken(token)),
    staleTime: 1000 * 60 * 5,
  })
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

    if (!token && canRefresh && requiresAuth) {
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

    if (token && canRefresh && requiresAuth) {
      try {
        await refreshAccessTokenIfNeeded()
        token = getStoredAccessToken() ?? token
      } catch (error) {
        captureError(error as Error, {
          source: 'http',
          severity: 'warning',
          context: {
            location: 'AuthGuard',
            action: 'refreshBeforeLoadUserInfo',
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
        const data = await loadUserInfoByToken(token)
        accountStore.login(data)
      } catch (error) {
        if (hasStoredRefreshToken()) {
          try {
            await forceRefreshAccessToken()
            const refreshedToken = getStoredAccessToken()

            if (refreshedToken) {
              const retryData = await loadUserInfoByToken(refreshedToken)
              accountStore.login(retryData)
              token = refreshedToken
            } else {
              throw new Error('Refresh succeeded but access token missing')
            }
          } catch (retryError) {
            captureError(retryError as Error, {
              source: 'http',
              severity: 'error',
              context: {
                location: 'AuthGuard',
                action: 'loadUserInfoRetryAfterRefresh',
              },
            })
            accountStore.logout()
            return { name: 'login', query: { redirect: to.fullPath } }
          }
        } else {
          // Token 过期或网络错误，清除状态并去登录页
          captureError(error as Error, {
            source: 'http',
            severity: 'error',
            context: {
              location: 'AuthGuard',
              action: 'loadUserInfo',
            },
          })
          accountStore.logout()
          return { name: 'login', query: { redirect: to.fullPath } }
        }
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
