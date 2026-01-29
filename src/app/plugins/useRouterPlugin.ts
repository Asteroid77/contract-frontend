import router from '@/router'
import type { ToBeInstalledPlugin } from '@/app/plugins/index'

export function useRouterPlugin(): ToBeInstalledPlugin {
  return {
    plugin: router,
  }
}
