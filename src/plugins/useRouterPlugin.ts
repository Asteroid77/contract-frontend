import router from '@/router'
import type { ToBeInstalledPlugin } from '@/plugins/index'

export function useRouterPlugin(): ToBeInstalledPlugin {
  return {
    plugin: router,
  }
}
