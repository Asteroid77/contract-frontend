import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import IndustriesSelect from '@/modules/shared/presentation/widget/IndustriesSelect'
import { Industries } from '@/modules/shared/application/constants/IndustriesContant'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
}))

vi.mock('naive-ui', () => ({
  selectProps: {},
  NSelect: defineComponent({
    name: 'MockNSelect',
    props: {
      options: { type: Array, required: false },
      placeholder: { type: String, required: false },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'div',
          {
            'data-test': 'NSelect',
            'data-placeholder': props.placeholder,
          },
          slots.default?.(),
        )
    },
  }),
}))

describe('IndustriesSelect', () => {
  it('passes Industries options to NSelect and forwards attrs/slots', () => {
    const wrapper = mount(IndustriesSelect, {
      attrs: {
        placeholder: '请选择行业',
      },
      slots: {
        default: () => h('span', { 'data-test': 'slot-content' }, 'slot'),
      },
    })

    const select = wrapper.findComponent({ name: 'MockNSelect' })
    expect(select.exists()).toBe(true)
    expect(select.props('options')).toEqual(Industries)
    expect(wrapper.find('[data-test="NSelect"]').attributes('data-placeholder')).toBe('请选择行业')
    expect(wrapper.find('[data-test="slot-content"]').exists()).toBe(true)
  })
})
