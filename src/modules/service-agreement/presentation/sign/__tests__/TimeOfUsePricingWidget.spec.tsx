import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('naive-ui', () => ({
  NFormItem: defineComponent({
    name: 'NFormItem',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-form-item' }, slots.default?.())
    },
  }),
  NSwitch: defineComponent({
    name: 'NSwitch',
    props: {
      value: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-test': 'n-switch',
          'data-value': String(props.value),
          onClick: () => emit('update:value', !props.value),
        })
    },
  }),
  NGrid: defineComponent({
    name: 'NGrid',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-grid' }, slots.default?.())
    },
  }),
  NFormItemGi: defineComponent({
    name: 'NFormItemGi',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-form-item-gi' }, slots.default?.())
    },
  }),
  NInputNumber: defineComponent({
    name: 'NInputNumber',
    props: {
      value: {
        type: Number,
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-test': 'n-input-number',
          'data-value': props.value == null ? '' : String(props.value),
          onClick: () => emit('update:value', 66),
        })
    },
  }),
}))

import TimeOfUsePricingWidget from '@/modules/service-agreement/presentation/sign/TimeOfUsePricingWidget'

const createModelValue = (enabled: boolean) => ({
  isTimeOfUsePricingEnabled: enabled,
  superPeakPercentage: 10,
  peakPercentage: 20,
  standardPercentage: 30,
  valleyPercentage: 40,
})

describe('TimeOfUsePricingWidget', () => {
  it('renders switch only when tou is disabled and toggles via update:modelValue', async () => {
    const wrapper = mount(TimeOfUsePricingWidget, {
      props: {
        modelValue: createModelValue(false),
        path: 'customerInfo',
      },
    })

    expect(wrapper.find('[data-test="n-switch"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="n-grid"]').exists()).toBe(false)

    await wrapper.find('[data-test="n-switch"]').trigger('click')

    const emitted = wrapper.emitted('update:modelValue') || []
    expect(emitted.length).toBeGreaterThan(0)
    const payload = emitted[0][0] as Record<string, unknown>
    expect(payload.isTimeOfUsePricingEnabled).toBe(true)
  })

  it('renders 4 percentage inputs when tou is enabled and updates field value', async () => {
    const wrapper = mount(TimeOfUsePricingWidget, {
      props: {
        modelValue: createModelValue(true),
        path: 'customerInfo',
      },
    })

    expect(wrapper.find('[data-test="n-grid"]').exists()).toBe(true)
    const inputs = wrapper.findAll('[data-test="n-input-number"]')
    expect(inputs).toHaveLength(4)

    await inputs[0].trigger('click')

    const emitted = wrapper.emitted('update:modelValue') || []
    expect(emitted.length).toBeGreaterThan(0)
    const payload = emitted[0][0] as Record<string, unknown>
    expect(payload.superPeakPercentage).toBe(66)
  })

  it('clears percentage fields when model toggles from enabled to disabled', async () => {
    const wrapper = mount(TimeOfUsePricingWidget, {
      props: {
        modelValue: createModelValue(true),
        path: 'customerInfo',
      },
    })

    await wrapper.setProps({
      modelValue: {
        ...createModelValue(true),
        isTimeOfUsePricingEnabled: false,
      },
    })
    await nextTick()

    const emitted = wrapper.emitted('update:modelValue') || []
    const lastPayload = emitted[emitted.length - 1][0] as Record<string, unknown>

    expect(lastPayload.isTimeOfUsePricingEnabled).toBe(false)
    expect(lastPayload.superPeakPercentage).toBeNull()
    expect(lastPayload.peakPercentage).toBeNull()
    expect(lastPayload.standardPercentage).toBeNull()
    expect(lastPayload.valleyPercentage).toBeNull()
  })
})
