import ZwIcon from '@/modules/shared/presentation/widget/ZwIcon.vue'
import { NIcon } from 'naive-ui'
import { h, type Component } from 'vue'

/**
 * 渲染图标组件
 * @param icon 图标名称
 * @returns 渲染函数
 */
export function renderIcon(icon: Component | null, name: string) {
  if (icon === null) {
    return () => h(ZwIcon, { name })
  }
  return () => h(NIcon, null, { default: () => h(icon) })
}
