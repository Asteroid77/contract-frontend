import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

type MockTemplateData =
  | {
      id?: number | string
    }
  | null
  | undefined

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
      const data = props.data as MockTemplateData
      return () => h('div', { 'data-test': 'user-print-template' }, String(data?.id ?? ''))
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
      const data = props.data as MockTemplateData
      return () => h('div', { 'data-test': 'sign-print-template' }, String(data?.id ?? ''))
    },
  }),
}))

import PrintTemplateSwitch from '@/modules/approval/presentation/print/PrintTemplateSwitch'

const approvalData = {
  id: 101,
  approvalData: {},
  sourceData: null,
}

describe('PrintTemplateSwitch', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders user additional info print template for 用户信息审批 without prop warning', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(PrintTemplateSwitch, {
      props: {
        name: '用户信息审批',
        data: approvalData as never,
      },
    })

    expect(wrapper.find('[data-test="user-print-template"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="sign-print-template"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="user-print-template"]').text()).toBe('101')
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('falls back to sign diff template for non-user process name without prop warning', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(PrintTemplateSwitch, {
      props: {
        name: '备案/签约信息审批',
        data: approvalData as never,
      },
    })

    expect(wrapper.find('[data-test="sign-print-template"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="user-print-template"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="sign-print-template"]').text()).toBe('101')
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
