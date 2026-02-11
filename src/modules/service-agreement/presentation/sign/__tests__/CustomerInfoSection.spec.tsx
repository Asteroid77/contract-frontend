import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('naive-ui', () => ({
  NSelect: defineComponent({
    name: 'NSelect',
    props: {
      value: {
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-test': 'n-select',
          'data-value': props.value == null ? '' : String(props.value),
          onClick: () => emit('update:value', 2),
        })
    },
  }),
  NInput: defineComponent({
    name: 'NInput',
    props: {
      value: {
        type: String,
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-test': 'n-input',
          'data-value': props.value ?? '',
          onClick: () => emit('update:value', 'updated-text'),
        })
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
          onClick: () => emit('update:value', 12345),
        })
    },
  }),
}))

vi.mock('@/modules/shared/presentation/widget/AppFormItem', () => ({
  default: defineComponent({
    name: 'AppFormItem',
    props: {
      path: {
        type: String,
        required: false,
      },
      label: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'div',
          {
            'data-test': 'app-form-item',
            'data-path': props.path ?? '',
            'data-label': props.label ?? '',
          },
          slots.default?.(),
        )
    },
  }),
}))

vi.mock('@/modules/shared/presentation/widget/PCACascader', () => ({
  default: defineComponent({
    name: 'ChinaAreaCascader',
    props: {
      value: {
        type: String,
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-test': 'area-cascader',
          'data-value': props.value ?? '',
          onClick: () => emit('update:value', '330100'),
        })
    },
  }),
}))

vi.mock('@/modules/shared/presentation/widget/IndustriesSelect', () => ({
  default: defineComponent({
    name: 'IndustriesSelect',
    props: {
      value: {
        type: String,
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-test': 'industries-select',
          'data-value': props.value ?? '',
          onClick: () => emit('update:value', 'industry-updated'),
        })
    },
  }),
}))

vi.mock('@/modules/service-agreement/presentation/sign/TimeOfUsePricingWidget', () => ({
  default: defineComponent({
    name: 'TimeOfUsePricingWidget',
    props: {
      path: {
        type: String,
        required: false,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-test': 'tou-widget',
          'data-path': props.path ?? '',
          onClick: () =>
            emit('update:modelValue', {
              isTimeOfUsePricingEnabled: true,
              superPeakPercentage: 11,
              peakPercentage: 22,
              standardPercentage: 33,
              valleyPercentage: 34,
            }),
        })
    },
  }),
}))

import CustomerInfoSection from '@/modules/service-agreement/presentation/sign/CustomerInfoSection'
import { ServiceAgreementStatusEnum } from '@/modules/service-agreement/application/constants'

const createModelValue = () => ({
  id: 1,
  status: ServiceAgreementStatusEnum.Record,
  companyName: 'Acme Corp',
  industry: 'industry-old',
  companyArea: '110000',
  companyAddress: 'Street 1',
  liaisonName: 'Alice',
  liaisonPosition: 'Manager',
  liaisonPhone: '13800000000',
  yearUsableCharge: 500,
  isTimeOfUsePricingEnabled: false,
  peakPercentage: null,
  superPeakPercentage: null,
  standardPercentage: null,
  valleyPercentage: null,
  comment: 'old-comment',
})

describe('CustomerInfoSection', () => {
  it('updates status/companyName/yearUsableCharge via native controls', async () => {
    const wrapper = mount(CustomerInfoSection, {
      props: {
        modelValue: createModelValue(),
      },
    })

    await wrapper.find('[data-path="customerInfo.status"] [data-test="n-select"]').trigger('click')
    await wrapper.find('[data-path="customerInfo.companyName"] [data-test="n-input"]').trigger('click')
    await wrapper
      .find('[data-path="customerInfo.yearUsableCharge"] [data-test="n-input-number"]')
      .trigger('click')

    const emitted = wrapper.emitted('update:modelValue') || []
    expect(emitted.length).toBe(3)

    const statusPayload = emitted[0][0] as Record<string, unknown>
    expect(statusPayload.status).toBe(2)
    expect(statusPayload.companyName).toBe('Acme Corp')

    const companyPayload = emitted[1][0] as Record<string, unknown>
    expect(companyPayload.companyName).toBe('updated-text')

    const chargePayload = emitted[2][0] as Record<string, unknown>
    expect(chargePayload.yearUsableCharge).toBe(12345)
  })

  it('updates through child widgets and keeps default path', async () => {
    const wrapper = mount(CustomerInfoSection, {
      props: {
        modelValue: createModelValue(),
      },
    })

    expect(wrapper.find('[data-test="tou-widget"]').attributes('data-path')).toBe('customerInfo')

    await wrapper.get('[data-test="industries-select"]').trigger('click')
    await wrapper.get('[data-test="area-cascader"]').trigger('click')
    await wrapper.get('[data-test="tou-widget"]').trigger('click')

    const emitted = wrapper.emitted('update:modelValue') || []
    expect(emitted.length).toBe(3)

    const industryPayload = emitted[0][0] as Record<string, unknown>
    expect(industryPayload.industry).toBe('industry-updated')

    const areaPayload = emitted[1][0] as Record<string, unknown>
    expect(areaPayload.companyArea).toBe('330100')

    const touPayload = emitted[2][0] as Record<string, unknown>
    expect(touPayload.isTimeOfUsePricingEnabled).toBe(true)
    expect(touPayload.superPeakPercentage).toBe(11)
    expect(touPayload.peakPercentage).toBe(22)
    expect(touPayload.standardPercentage).toBe(33)
    expect(touPayload.valleyPercentage).toBe(34)
  })
})
