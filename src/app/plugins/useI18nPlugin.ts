import { i18n } from '@/_utils/i18n'
import type { ToBeInstalledPlugin } from '@/app/plugins'

/**
 * 初始化i18n
 */
export function useI18nPlugin(): ToBeInstalledPlugin {
  return { plugin: i18n }
}
