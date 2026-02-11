import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { NIcon } from 'naive-ui'
import ZwIcon from '@/modules/shared/presentation/widget/ZwIcon.vue'
import { renderIcon } from '@/_utils/widget/renderIcon'

describe('renderIcon', () => {
  it('renders ZwIcon when icon is null', () => {
    const render = renderIcon(null, 'icon-custom')
    const vnode = render()

    expect(vnode.type).toBe(ZwIcon)
    expect((vnode.props as { name?: string } | null)?.name).toBe('icon-custom')
  })

  it('renders NIcon wrapper and forwards icon component to default slot', () => {
    const IconComponent = defineComponent({
      name: 'IconComponent',
      setup: () => () => h('svg'),
    })

    const render = renderIcon(IconComponent, 'ignored-name')
    const vnode = render()

    expect(vnode.type).toBe(NIcon)

    const children = vnode.children as { default?: () => unknown } | null
    const slotResult = children?.default?.()
    const slottedVNode = Array.isArray(slotResult) ? slotResult[0] : slotResult

    expect((slottedVNode as { type?: unknown }).type).toBe(IconComponent)
  })
})
