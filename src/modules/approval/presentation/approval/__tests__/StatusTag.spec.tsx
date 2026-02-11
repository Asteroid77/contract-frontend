import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
}))

vi.mock('naive-ui', () => ({
  NTag: defineComponent({
    name: 'MockNTag',
    props: {
      type: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () => h('div', { 'data-test': 'n-tag', 'data-type': props.type }, slots.default?.())
    },
  }),
}))

import createStatusTag from '@/modules/approval/presentation/approval/StatusTag'

describe('StatusTag', () => {
  it('renders text mode with NTag and mapped status type', () => {
    const component = createStatusTag('approved', 'Task')

    const wrapper = mount(component, {
      props: {
        text: true,
      },
    })

    expect(wrapper.find('[data-test="n-tag"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="n-tag"]').attributes('data-type')).toBe('info')
    expect(wrapper.text()).toContain('t:domain.approval.status.approved')
  })

  it('renders plain span when text mode is false', () => {
    const component = createStatusTag('pending', 'Task')

    const wrapper = mount(component, {
      props: {
        text: false,
      },
    })

    expect(wrapper.find('[data-test="n-tag"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('t:domain.approval.status.pending')
  })

  it('uses finished status text and type when finished is true', () => {
    const component = createStatusTag('rejected', 'Instance', true)

    const wrapper = mount(component, {
      props: {
        text: true,
      },
    })

    expect(wrapper.find('[data-test="n-tag"]').attributes('data-type')).toBe('info')
    expect(wrapper.text()).toContain('t:domain.approval.status.finished')
  })

  it('falls back to common status text key for unknown status', () => {
    const component = createStatusTag('unknown' as never, 'Task')

    const wrapper = mount(component, {
      props: {
        text: false,
      },
    })

    expect(wrapper.text()).toContain('t:common.label.status')
  })
})
