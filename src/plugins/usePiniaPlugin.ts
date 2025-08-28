import { createPinia } from 'pinia'
import type { ToBeInstalledPlugin } from '@/hooks/plugins/index'

/**
 * 初始化pinia
 */
export function usePiniaPlugin(): ToBeInstalledPlugin {
  return { plugin: createPinia() }
}
