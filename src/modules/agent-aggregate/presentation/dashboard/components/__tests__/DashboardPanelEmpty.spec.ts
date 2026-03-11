import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('naive-ui', () => ({
  NButton: defineComponent({
    name: 'NButton',
    props: {
      onClick: {
        type: Function,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () => h('button', { onClick: props.onClick }, slots.default?.())
    },
  }),
  NEmpty: defineComponent({
    name: 'NEmpty',
    props: {
      description: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('div', { class: 'n-empty' }, [
          h('div', { class: 'n-empty__description' }, props.description),
          h('div', { class: 'n-empty__extra' }, slots.extra?.()),
        ])
    },
  }),
}))

import DashboardPanelEmpty from '@/modules/agent-aggregate/presentation/dashboard/components/DashboardPanelEmpty.vue'

describe('DashboardPanelEmpty', () => {
  it('renders an explicit centered empty-state container', () => {
    const wrapper = mount(DashboardPanelEmpty, {
      props: {
        description: '暂无数据',
        onRefresh: vi.fn(),
      },
    })

    expect(wrapper.find('.agent-aggregate-dashboard__panel-state--empty').exists()).toBe(true)
  })
})
