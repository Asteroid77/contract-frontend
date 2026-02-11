import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import AppFormItem from '@/modules/shared/presentation/widget/AppFormItem'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string, params?: Record<string, unknown>) => `t:${key}:${String(params?.label ?? '')}`,
}))

vi.mock('naive-ui', () => ({
  formItemProps: {
    label: { type: String, required: false },
  },
  NFormItem: defineComponent({
    name: 'MockNFormItem',
    setup(_props, { slots }) {
      return () => h('div', { 'data-test': 'NFormItem' }, slots.default?.())
    },
  }),
}))

const MockSelectLike = defineComponent({
  name: 'MockSelect',
  props: {
    placeholder: { type: String, required: false },
  },
  setup(props) {
    return () => h('input', { 'data-test': 'select-control', placeholder: props.placeholder })
  },
})

const MockInputLike = defineComponent({
  name: 'MockInput',
  props: {
    placeholder: { type: String, required: false },
  },
  setup(props) {
    return () => h('input', { 'data-test': 'input-control', placeholder: props.placeholder })
  },
})

describe('AppFormItem', () => {
  it('auto-generates select placeholder by child component name', () => {
    const wrapper = mount(AppFormItem, {
      props: {
        label: '开户行',
      },
      slots: {
        default: () => h(MockSelectLike),
      },
    })

    expect(wrapper.find('[data-test="NFormItem"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="select-control"]').attributes('placeholder')).toBe(
      't:common.placeholder.select:开户行',
    )
  })

  it('auto-generates input placeholder for non-select child', () => {
    const wrapper = mount(AppFormItem, {
      props: {
        label: '用户名',
      },
      slots: {
        default: () => h(MockInputLike),
      },
    })

    expect(wrapper.find('[data-test="input-control"]').attributes('placeholder')).toBe(
      't:common.placeholder.input:用户名',
    )
  })

  it('does not override existing placeholder and handles empty slot', () => {
    const withPlaceholder = mount(AppFormItem, {
      props: {
        label: '用户名',
      },
      slots: {
        default: () => h(MockInputLike, { placeholder: '已有占位符' }),
      },
    })

    expect(withPlaceholder.find('[data-test="input-control"]').attributes('placeholder')).toBe(
      '已有占位符',
    )

    const withoutSlot = mount(AppFormItem, {
      props: {
        label: '空插槽',
      },
    })

    expect(withoutSlot.find('[data-test="NFormItem"]').exists()).toBe(true)
  })
})
