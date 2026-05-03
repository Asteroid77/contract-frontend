import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('naive-ui', () => ({
  NIcon: defineComponent({
    name: 'MockNIcon',
    setup(_, { slots }) {
      return () => h('span', { 'data-test': 'n-icon' }, slots.default?.())
    },
  }),
}))

vi.mock('lucide-vue-next', () => ({
  ChevronDown: defineComponent({
    name: 'MockChevronDown',
    setup() {
      return () => h('i', { 'data-test': 'icon-down' }, 'down')
    },
  }),
  ChevronRight: defineComponent({
    name: 'MockChevronRight',
    setup() {
      return () => h('i', { 'data-test': 'icon-right' }, 'right')
    },
  }),
}))

import DocumentSection from '@/modules/approval/presentation/approval/DocumentSection'

describe('DocumentSection', () => {
  it('toggles expanded state and icon on header click', async () => {
    const wrapper = mount(DocumentSection, {
      props: {
        title: '文档标题',
      },
      slots: {
        default: () => '文档内容',
      },
    })

    expect(wrapper.text()).toContain('文档标题')
    expect(wrapper.text()).toContain('文档内容')

    const content = wrapper.find('.document-section-content')
    expect(content.exists()).toBe(true)
    expect(content.classes()).not.toContain('screen-hidden')
    expect(wrapper.find('[data-test="icon-down"]').exists()).toBe(true)

    await wrapper.find('.document-section-header').trigger('click')

    expect(content.classes()).toContain('screen-hidden')
    expect(wrapper.find('[data-test="icon-right"]').exists()).toBe(true)

    await wrapper.find('.document-section-header').trigger('click')

    expect(content.classes()).not.toContain('screen-hidden')
    expect(wrapper.find('[data-test="icon-down"]').exists()).toBe(true)
  })

  it('respects defaultExpanded=false at initial render', () => {
    const wrapper = mount(DocumentSection, {
      props: {
        title: '折叠标题',
        defaultExpanded: false,
      },
      slots: {
        default: () => '默认折叠内容',
      },
    })

    const content = wrapper.find('.document-section-content')
    expect(content.classes()).toContain('screen-hidden')
    expect(wrapper.find('[data-test="icon-right"]').exists()).toBe(true)
  })
})
