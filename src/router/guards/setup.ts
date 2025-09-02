import type { Router } from 'vue-router'
import { setupLoadingBarGuards } from './SetupLoadingBarGuards'
import { setupAuthGuards } from './SetupAuthGuard'

export function setupGuards(router: Router) {
  // 按照执行顺序注册各个守卫
  // 注册LoadingBar守卫
  setupLoadingBarGuards(router)
  // 注册Auth守卫
  setupAuthGuards(router)
}
