import type { Router } from 'vue-router'
import { loadingBar, notification } from '@/_utils/discrete_naive_api'
export function setupLoadingBarGuards(router: Router) {
  router.beforeEach(async (to, from, next) => {
    loadingBar.start()
    return next()
  })

  router.afterEach(() => {
    loadingBar.finish()
  })

  router.onError((error) => {
    loadingBar.error()
    notification['error']({
      title: error.message,
      duration: 2500,
    })
  })
}
