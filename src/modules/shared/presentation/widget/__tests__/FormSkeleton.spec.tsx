import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import FormSkeleton from '@/modules/shared/presentation/widget/FormSkeleton'

vi.mock('naive-ui', () => ({
  NGrid: defineComponent({
    name: 'MockNGrid',
    props: {
      cols: { type: [Number, String], required: false },
    },
    setup(props, { slots }) {
      return () => h('div', { 'data-test': 'NGrid', 'data-cols': String(props.cols) }, slots.default?.())
    },
  }),
  NGi: defineComponent({
    name: 'MockNGi',
    setup(_props, { slots }) {
      return () => h('div', { 'data-test': 'NGi' }, slots.default?.())
    },
  }),
  NSkeleton: defineComponent({
    name: 'MockNSkeleton',
    props: {
      text: { type: Boolean, required: false },
      height: { type: String, required: false },
      width: { type: String, required: false },
      round: { type: Boolean, required: false },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'NSkeleton',
          'data-text': props.text ? 'true' : 'false',
          'data-height': props.height,
          'data-width': props.width,
          'data-round': props.round ? 'true' : 'false',
        })
    },
  }),
  NSpace: defineComponent({
    name: 'MockNSpace',
    setup(_props, { slots }) {
      return () => h('div', { 'data-test': 'NSpace' }, slots.default?.())
    },
  }),
}))

describe('FormSkeleton', () => {
  it('computes total count from cols and rows for input type', () => {
    const wrapper = mount(FormSkeleton, {
      props: {
        cols: 3,
        rows: 2,
        type: 'input',
      },
    })

    expect(wrapper.findAll('[data-test="NGi"]').length).toBe(6)
  })

  it('uses explicit count when count is provided', () => {
    const wrapper = mount(FormSkeleton, {
      props: {
        cols: 4,
        rows: 3,
        count: 5,
      },
    })

    expect(wrapper.findAll('[data-test="NGi"]').length).toBe(5)
  })

  it('forces single column and one item for upload type', () => {
    const wrapper = mount(FormSkeleton, {
      props: {
        cols: 4,
        rows: 3,
        type: 'upload',
      },
    })

    expect(wrapper.find('[data-test="NGrid"]').attributes('data-cols')).toBe('1')
    expect(wrapper.findAll('[data-test="NGi"]').length).toBe(1)
    expect(wrapper.findAll('[data-test="NSkeleton"][data-height="5rem"]').length).toBe(3)
  })

  it('renders textarea control skeleton with expected height', () => {
    const wrapper = mount(FormSkeleton, {
      props: {
        type: 'textarea',
        count: 1,
      },
    })

    expect(wrapper.find('[data-test="NSkeleton"][data-height="6rem"]').exists()).toBe(true)
  })
})
