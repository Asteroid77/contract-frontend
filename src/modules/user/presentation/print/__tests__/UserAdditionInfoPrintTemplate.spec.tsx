import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('@/modules/approval/presentation/print/DiffRenderer', () => ({
  DiffRenderer: defineComponent({
    name: 'DiffRenderer',
    props: {
      newValue: {
        required: false,
      },
      oldValue: {
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'diff-renderer',
          'data-new': props.newValue == null ? '' : String(props.newValue),
          'data-old': props.oldValue == null ? '' : String(props.oldValue),
        })
    },
  }),
}))

import UserAdditionInfoPrintTemplate from '@/modules/user/presentation/print/UserAdditionInfoPrintTemplate'
import { RegisterType } from '@/modules/user/application/constants'

describe('UserAdditionInfoPrintTemplate', () => {
  it('renders empty state when no visible rows', () => {
    const wrapper = mount(UserAdditionInfoPrintTemplate, {
      props: {
        data: {
          approvalData: null,
          sourceData: null,
        } as never,
      },
    })

    expect(wrapper.text()).toContain('common.label.none')
    expect(wrapper.find('[data-test="diff-renderer"]').exists()).toBe(false)
  })

  it('parses data and renders converted diff rows', () => {
    const approvalData = {
      registerType: RegisterType.INDIVIDUAL,
      name: 'Alice',
      bankName: 'ICBC',
      bankAccount: '123456',
      pca: '110000',
    }

    const sourceData = {
      registerType: RegisterType.LEGAL_REPRESENTATIVE,
      name: '9133XXXX',
      bankName: 'CCB',
      bankAccount: '999999',
      pca: '120000',
    }

    const wrapper = mount(UserAdditionInfoPrintTemplate, {
      props: {
        data: {
          approvalData: JSON.stringify(approvalData),
          sourceData: JSON.stringify(sourceData),
        } as never,
        approvalType: true,
      },
    })

    expect(wrapper.text()).toContain('domain.user.field.name')
    expect(wrapper.text()).not.toContain('domain.user.field.usci')

    const renderers = wrapper.findAll('[data-test="diff-renderer"]')
    expect(renderers.length).toBeGreaterThan(0)

    const hasBankDiff = renderers.some((node) => {
      return (
        node.attributes('data-new') === '中国工商银行' &&
        node.attributes('data-old') === '中国建设银行'
      )
    })
    expect(hasBankDiff).toBe(true)

    const hasRegisterTypeDiff = renderers.some((node) => {
      return (
        node.attributes('data-new') === 'common.options.registerType.individual' &&
        node.attributes('data-old') === 'common.options.registerType.company'
      )
    })
    expect(hasRegisterTypeDiff).toBe(true)
  })
})
