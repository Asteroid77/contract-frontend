import type { Router } from 'vue-router'
import { loadingBar } from '@/_utils/discrete_naive_api'
export function setupLoadingBarGuards(router: Router) {
  router.beforeEach(async (to, from, next) => {
    loadingBar.start()
    return next()
  })

  router.afterEach((to, from) => {
    loadingBar.finish()
  })

  router.onError((error) => {
    loadingBar.error()
  })
}
