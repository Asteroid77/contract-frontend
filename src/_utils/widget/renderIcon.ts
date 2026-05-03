import ZwIcon from '@/modules/shared/presentation/widget/ZwIcon.vue'
import { NIcon } from 'naive-ui'
import { h, type Component } from 'vue'
import { resolveAppIcon } from './iconRegistry'

/**
 * 渲染图标组件
 * @param icon 图标名称
 * @returns 渲染函数
 */
export function renderIcon(icon: Component | null, name: string): () => ReturnType<typeof h>
export function renderIcon(name: string): () => ReturnType<typeof h>
export function renderIcon(iconOrName: Component | string | null, name = '') {
  if (typeof iconOrName === 'string') {
    const icon = resolveAppIcon(iconOrName)

    if (icon) {
      return () => h(NIcon, null, { default: () => h(icon) })
    }

    return () => h(ZwIcon, { name: iconOrName })
  }

  if (iconOrName === null) {
    return () => h(ZwIcon, { name })
  }

  return () => h(NIcon, null, { default: () => h(iconOrName) })
}
