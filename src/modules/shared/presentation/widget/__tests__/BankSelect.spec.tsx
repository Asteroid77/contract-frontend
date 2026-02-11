import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import BankSelect from '@/modules/shared/presentation/widget/BankSelect'
import { BankOption } from '@/modules/shared/application/constants/BankConstant'

vi.mock('naive-ui', () => ({
  selectProps: {},
  NAvatar: defineComponent({
    name: 'MockNAvatar',
    setup(_props, { slots }) {
      return () => h('div', { 'data-test': 'NAvatar' }, slots.default?.())
    },
  }),
  NText: defineComponent({
    name: 'MockNText',
    setup(_props, { slots }) {
      return () => h('span', { 'data-test': 'NText' }, slots.default?.())
    },
  }),
  NSelect: defineComponent({
    name: 'MockNSelect',
    props: {
      options: { type: Array, required: false },
      clearable: { type: Boolean, required: false },
      renderLabel: { type: Function, required: false },
      renderTag: { type: Function, required: false },
      placeholder: { type: String, required: false },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'NSelect',
          'data-placeholder': props.placeholder,
        })
    },
  }),
}))

vi.mock('@/modules/shared/presentation/widget/ZwIcon.vue', () => ({
  default: defineComponent({
    name: 'MockZwIcon',
    props: {
      name: { type: String, required: false },
    },
    setup(props) {
      return () => h('i', { 'data-test': 'ZwIcon', 'data-name': props.name })
    },
  }),
}))

describe('BankSelect', () => {
  it('passes bank options and renderers to NSelect', () => {
    const wrapper = mount(BankSelect, {
      attrs: {
        placeholder: '请选择银行',
      },
    })

    const select = wrapper.findComponent({ name: 'MockNSelect' })
    expect(select.exists()).toBe(true)
    expect(select.props('options')).toEqual(BankOption)
    expect(select.props('clearable')).toBe(true)
    expect(typeof select.props('renderLabel')).toBe('function')
    expect(typeof select.props('renderTag')).toBe('function')
    expect(wrapper.find('[data-test="NSelect"]').attributes('data-placeholder')).toBe('请选择银行')
  })

  it('renderLabel/renderTag can be executed and return vnode-like values', () => {
    const wrapper = mount(BankSelect)
    const select = wrapper.findComponent({ name: 'MockNSelect' })

    const renderLabel = select.props('renderLabel') as (option: any) => unknown
    const renderTag = select.props('renderTag') as (payload: any) => unknown

    const labelVNode = renderLabel({ value: 'ICBC', label: '中国工商银行' })
    const tagVNode = renderTag({ option: { value: 'ICBC', label: '中国工商银行' } })

    expect(labelVNode).toBeTruthy()
    expect(tagVNode).toBeTruthy()
  })
})
