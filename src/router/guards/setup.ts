import type { Router } from 'vue-router'
import { setupLoadingBarGuards } from './SetupLoadingBarGuards'
import { setupAuthGuards } from './SetupAuthGuard'
import { setupAbilityGuard } from './SetupAbilityGuard'

export function setupGuards(router: Router) {
  // 按照执行顺序注册各个守卫
  // 1. 注册 LoadingBar 守卫
  setupLoadingBarGuards(router)
  // 2. 注册 Auth 守卫（认证检查）
  setupAuthGuards(router)
  // 3. 注册 CASL Ability 守卫（权限检查）
  setupAbilityGuard(router)
}
