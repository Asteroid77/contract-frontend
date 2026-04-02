import type { Router } from 'vue-router'
import { setupLoadingBarGuards } from './SetupLoadingBarGuards'
import { setupAuthGuards } from './SetupAuthGuard'
import { setupAbilityGuard } from './SetupAbilityGuard'
import { AUTH_SESSION_CLEARED_EVENT } from '@/modules/access/application/token-manager'

let sessionRedirectListenerRegistered = false

function setupSessionRedirectGuard(router: Router) {
  if (sessionRedirectListenerRegistered || typeof window === 'undefined') {
    return
  }

  sessionRedirectListenerRegistered = true
  window.addEventListener(AUTH_SESSION_CLEARED_EVENT, () => {
    const currentRoute = router.currentRoute.value
    const requiresAuth = currentRoute.meta.requiresAuth !== false

    if (!requiresAuth || currentRoute.name === 'login') {
      return
    }

    router
      .replace({
        name: 'login',
        query: { redirect: currentRoute.fullPath },
      })
      .catch(() => {
        // ignore duplicated navigation errors
      })
  })
}

export function setupGuards(router: Router) {
  // 按照执行顺序注册各个守卫
  // 1. 注册 LoadingBar 守卫
  setupLoadingBarGuards(router)
  // 2. 注册 Auth 守卫（认证检查）
  setupAuthGuards(router)
  // 3. 注册 CASL Ability 守卫（权限检查）
  setupAbilityGuard(router)
  // 4. 会话清理后立即重定向（避免延后到下一次导航才跳登录）
  setupSessionRedirectGuard(router)
}
