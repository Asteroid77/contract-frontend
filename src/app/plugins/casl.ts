/**
 * CASL Vue 插件集成
 * 将 CASL ability 实例注入到 Vue 应用中
 */

import type { App } from 'vue'
import { abilitiesPlugin } from '@casl/vue'
import { ability } from '@/modules/access/application/ability'
import { canDirective } from '@/modules/access/presentation/directives/can'

/**
 * 安装 CASL 插件
 */
export function setupCasl(app: App): void {
  // 1. 注册 CASL Vue 插件
  app.use(abilitiesPlugin, ability, {
    useGlobalProperties: true, // 允许在模板中使用 $can
  })

  // 2. 注册 v-can 指令
  app.directive('can', canDirective)
}
