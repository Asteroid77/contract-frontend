import { createPinia } from 'pinia'
import type { ToBeInstalledPlugin } from '@/plugins'

/**
 * 初始化pinia
 */
export function usePiniaPlugin(): ToBeInstalledPlugin {
  return { plugin: createPinia() }
}
