import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('naive-ui', () => ({
  NFormItem: defineComponent({
    name: 'NFormItem',
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
            'data-test': 'n-form-item',
            'data-path': props.path ?? '',
            'data-label': props.label ?? '',
          },
          slots.default?.(),
        )
    },
  }),
  NDatePicker: defineComponent({
    name: 'NDatePicker',
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
          'data-test': 'n-date-picker',
          'data-value': props.value == null ? '' : String(props.value),
          onClick: () => emit('update:value', 1740000000000),
        })
    },
  }),
}))

vi.mock('@/modules/service-agreement/presentation/sign/PriceGroupWidget', () => ({
  default: defineComponent({
    name: 'PriceGroupWidget',
    props: {
      modelValue: {
        type: Object,
        required: true,
      },
      path: {
        type: String,
        required: false,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-test': 'price-group-widget',
          'data-path': props.path ?? '',
          'data-price-model': String((props.modelValue as Record<string, unknown>).priceModel ?? ''),
          onClick: () => emit('update:modelValue', { fixedPrice: '0.9999', comment: 'pg-comment' }),
        })
    },
  }),
}))

vi.mock('@/modules/service-agreement/presentation/sign/ServicePointSpecificationGroup', () => ({
  default: defineComponent({
    name: 'ServicePointSpecificationGroup',
    props: {
      value: {
        type: Array,
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-test': 'service-point-group',
          'data-value-len': String((props.value || []).length),
          onClick: () => emit('update:value', [{ serviceAccount: 'SNEW' }]),
        })
    },
  }),
}))

import SignInfoSection from '@/modules/service-agreement/presentation/sign/SignInfoSection'
import {
  PriceCategoryEnum,
  PriceModelEnum,
  PriceTypeEnum,
  UsageCategoryEnum,
} from '@/modules/service-agreement/application/constants'

const createModelValue = () => ({
  priceModel: PriceModelEnum.Guaranteed,
  priceType: PriceTypeEnum.PowerPlantSide,
  priceCategory: PriceCategoryEnum.FixedPrice,
  fixedPrice: '0.1234',
  fixedSpread: null,
  revenueShareRatio: null,
  comment: 'old-comment',
  expirationTime: 1730000000000,
  servicePointSpecifications: [
    {
      id: 1,
      agreementId: 100,
      serviceAccount: 'S001',
      transformerCapacity: 100,
      electricityConsumptionType: UsageCategoryEnum.LargeIndustrial as 1,
      voltageClass: '10kV',
    },
  ],
})

describe('SignInfoSection', () => {
  it('renders core items and forwards child updates through update:modelValue', async () => {
    const modelValue = createModelValue()
    const wrapper = mount(SignInfoSection, {
      props: {
        modelValue,
      },
    })

    expect(wrapper.find('[data-test="price-group-widget"]').attributes('data-path')).toBe('signInfo')
    expect(wrapper.find('[data-path="signInfo.expirationTime"]').exists()).toBe(true)
    expect(wrapper.find('[data-path="signInfo.servicePointSpecifications"]').exists()).toBe(true)

    await wrapper.get('[data-test="price-group-widget"]').trigger('click')
    await wrapper.get('[data-test="n-date-picker"]').trigger('click')
    await wrapper.get('[data-test="service-point-group"]').trigger('click')

    const emitted = wrapper.emitted('update:modelValue') || []
    expect(emitted.length).toBe(2)

    const payloadFromPrice = emitted[0][0] as Record<string, unknown>
    expect(payloadFromPrice.fixedPrice).toBe('0.9999')
    expect(payloadFromPrice.comment).toBe('pg-comment')

    expect(modelValue.expirationTime).toBe(1740000000000)

    const payloadFromSps = emitted[1][0] as Record<string, unknown>
    const sps = payloadFromSps.servicePointSpecifications as Array<Record<string, unknown>>
    expect(sps).toHaveLength(1)
    expect(sps[0].serviceAccount).toBe('SNEW')
  })
})
