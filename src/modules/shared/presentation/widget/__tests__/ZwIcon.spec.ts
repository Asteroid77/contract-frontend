import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('naive-ui', () => ({
  NIcon: defineComponent({
    name: 'NIcon',
    props: {
      size: {
        type: Number,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'div',
          { 'data-test': 'n-icon', 'data-size': String(props.size ?? '') },
          slots.default?.(),
        )
    },
  }),
}))

import ZwIcon from '@/modules/shared/presentation/widget/ZwIcon.vue'

describe('ZwIcon', () => {
  it('uses default size and renders href from name', () => {
    const wrapper = mount(ZwIcon, {
      props: {
        name: 'icon-demo',
      },
    })

    expect(wrapper.get('[data-test="n-icon"]').attributes('data-size')).toBe('22')
    const attrs = wrapper.get('use').attributes()
    const href = attrs['xlink:href'] ?? attrs.href
    expect(href).toBe('#icon-demo')
  })

  it('uses custom size when provided', () => {
    const wrapper = mount(ZwIcon, {
      props: {
        name: 'icon-user',
        size: 30,
      },
    })

    expect(wrapper.get('[data-test="n-icon"]').attributes('data-size')).toBe('30')
    const attrs = wrapper.get('use').attributes()
    const href = attrs['xlink:href'] ?? attrs.href
    expect(href).toBe('#icon-user')
  })
})
