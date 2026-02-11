import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/modules/user/presentation/print/UserAdditionInfoPrintTemplate', () => ({
  default: defineComponent({
    name: 'MockUserAdditionInfoPrintTemplate',
    props: {
      data: {
        type: Object,
        required: false,
      },
    },
    setup(props) {
      return () => h('div', { 'data-test': 'user-template' }, String((props.data as any)?.id ?? ''))
    },
  }),
}))

vi.mock('@/modules/service-agreement/presentation/print/SignDiffTemplate', () => ({
  default: defineComponent({
    name: 'MockSignDiffTemplate',
    props: {
      data: {
        type: Object,
        required: false,
      },
    },
    setup(props) {
      return () => h('div', { 'data-test': 'sign-template' }, String((props.data as any)?.id ?? ''))
    },
  }),
}))

import { templateSwitch } from '@/modules/approval/presentation/approval/template/TemplateSwitch'

const approvalData = {
  id: 202,
  approvalData: {},
  sourceData: null,
}

describe('templateSwitch', () => {
  it('renders user template for 用户信息审批', () => {
    const wrapper = mount(templateSwitch, {
      props: {
        name: '用户信息审批',
        data: approvalData as never,
      },
    })

    expect(wrapper.find('[data-test="user-template"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="sign-template"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="user-template"]').text()).toBe('202')
  })

  it('renders sign template for other process names', () => {
    const wrapper = mount(templateSwitch, {
      props: {
        name: '备案/签约信息审批',
        data: approvalData as never,
      },
    })

    expect(wrapper.find('[data-test="sign-template"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="user-template"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="sign-template"]').text()).toBe('202')
  })
})
