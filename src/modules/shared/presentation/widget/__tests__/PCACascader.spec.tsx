import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import PCACascader from '@/modules/shared/presentation/widget/PCACascader'
import areaData from '@/modules/shared/application/constants/PCA.json'

vi.mock('naive-ui', () => ({
  cascaderProps: {
    value: { type: [String, Number, Array, Object], required: false },
  },
  NCascader: defineComponent({
    name: 'MockNCascader',
    props: {
      options: { type: Array, required: false },
      valueField: { type: String, required: false },
      showPath: { type: Boolean, required: false },
      checkStrategy: { type: String, required: false },
      value: { type: [String, Number, Array, Object], required: false },
      placeholder: { type: String, required: false },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'div',
          {
            'data-test': 'NCascader',
            'data-value-field': props.valueField,
            'data-show-path': String(props.showPath),
            'data-check-strategy': props.checkStrategy,
            'data-placeholder': props.placeholder,
            'data-value': props.value === undefined ? 'undefined' : String(props.value),
          },
          slots.default?.(),
        )
    },
  }),
}))

describe('PCACascader', () => {
  it('injects default area options and fixed cascader behaviors', () => {
    const wrapper = mount(PCACascader, {
      props: {
        value: '110000',
      },
      attrs: {
        placeholder: '请选择省市区',
      },
    })

    const cascader = wrapper.findComponent({ name: 'MockNCascader' })
    expect(cascader.exists()).toBe(true)
    expect(cascader.props('options')).toEqual(areaData)

    const root = wrapper.find('[data-test="NCascader"]')
    expect(root.attributes('data-value-field')).toBe('key')
    expect(root.attributes('data-show-path')).toBe('true')
    expect(root.attributes('data-check-strategy')).toBe('child')
    expect(root.attributes('data-placeholder')).toBe('请选择省市区')
    expect(root.attributes('data-value')).toBe('110000')
  })

  it('converts falsy value to undefined', () => {
    const wrapper = mount(PCACascader, {
      props: {
        value: '',
      },
    })

    expect(wrapper.find('[data-test="NCascader"]').attributes('data-value')).toBe('undefined')
  })
})
