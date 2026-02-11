import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('naive-ui', () => ({
  NCard: defineComponent({
    name: 'NCard',
    props: {
      title: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('div', {
          'data-test': 'n-card',
          'data-title': props.title || '',
        }, slots.default?.())
    },
  }),
  NSplit: defineComponent({
    name: 'NSplit',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-split' }, [slots['1']?.(), slots['2']?.()])
    },
  }),
}))

vi.mock('@/modules/user/presentation/user_additional_info/UserAdditionalInfoForm', () => ({
  default: defineComponent({
    name: 'MockUserAdditionalInfoForm',
    props: {
      initialValue: {
        type: Object,
        required: false,
      },
      type: {
        type: String,
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'user-additional-info-form',
          'data-initial': JSON.stringify(props.initialValue || null),
          'data-type': props.type || '',
        })
    },
  }),
}))

import AdditionalInfoDiffTemplate from '@/modules/approval/presentation/approval/template/AdditionalInfoDiffTemplate'

describe('AdditionalInfoDiffTemplate', () => {
  it('renders single detail form when sourceData is empty', () => {
    const approvalData = {
      registerType: 2,
      name: '张三',
    }

    const wrapper = mount(AdditionalInfoDiffTemplate, {
      props: {
        data: {
          id: 101,
          approvalData,
          sourceData: null,
        } as never,
      },
    })

    expect(wrapper.find('[data-test="n-split"]').exists()).toBe(false)

    const forms = wrapper.findAll('[data-test="user-additional-info-form"]')
    expect(forms).toHaveLength(1)

    expect(forms[0].attributes('data-type')).toBe('detail')
    expect(JSON.parse(forms[0].attributes('data-initial') || 'null')).toEqual(approvalData)
  })

  it('renders split compare view when sourceData exists', () => {
    const approvalData = {
      registerType: 2,
      name: '新数据',
    }
    const sourceData = {
      registerType: 1,
      name: '旧数据',
    }

    const wrapper = mount(AdditionalInfoDiffTemplate, {
      props: {
        data: {
          id: 102,
          approvalData,
          sourceData,
        } as never,
      },
    })

    expect(wrapper.find('[data-test="n-split"]').exists()).toBe(true)

    const cards = wrapper.findAll('[data-test="n-card"]')
    expect(cards).toHaveLength(2)
    expect(cards[0].attributes('data-title')).toBe('domain.approval.label.newData')
    expect(cards[1].attributes('data-title')).toBe('domain.approval.label.oldData')

    const forms = wrapper.findAll('[data-test="user-additional-info-form"]')
    expect(forms).toHaveLength(2)
    expect(JSON.parse(forms[0].attributes('data-initial') || 'null')).toEqual(approvalData)
    expect(JSON.parse(forms[1].attributes('data-initial') || 'null')).toEqual(sourceData)
  })
})
