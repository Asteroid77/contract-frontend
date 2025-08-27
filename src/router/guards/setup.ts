import type { Router } from 'vue-router'
import { setupLoadingBarGuards } from './SetupLoadingBarGuards'

export function setupGuards(router: Router) {
  // 按照执行顺序注册各个守卫
  setupLoadingBarGuards(router)
}
