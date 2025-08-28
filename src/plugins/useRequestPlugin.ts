import { VueQueryPlugin } from '@tanstack/vue-query'
import type { ToBeInstalledPlugin } from '@/hooks/plugins/index'

/**
 * 初始化TanStack Query
 */
export function useRequestPlugin(): ToBeInstalledPlugin {
  return {
    plugin: VueQueryPlugin,
  }
}
