import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
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
      options: {
        type: Array,
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-test': 'n-select',
          'data-value': props.value == null ? '' : String(props.value),
          onClick: () => {
            const first = Array.isArray(props.options) && props.options.length > 0 ? props.options[0] : null
            emit('update:value', (first as { value?: unknown } | null)?.value ?? 1)
          },
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
          onClick: () => emit('update:value', 88),
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
          onClick: () => emit('update:value', 'remark-updated'),
        })
    },
  }),
}))

vi.mock('@/modules/shared/presentation/widget/AppFormItem', () => ({
  default: defineComponent({
    name: 'AppFormItem',
    props: {
      label: {
        type: String,
        required: false,
      },
      path: {
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
          },
          slots.default?.(),
        )
    },
  }),
}))

import PriceGroupWidget from '@/modules/service-agreement/presentation/sign/PriceGroupWidget'
import {
  PriceCategoryEnum,
  PriceModelEnum,
  PriceTypeEnum,
} from '@/modules/service-agreement/application/constants'

const createModelValue = () => ({
  priceModel: PriceModelEnum.Guaranteed,
  priceType: PriceTypeEnum.PowerPlantSide,
  priceCategory: PriceCategoryEnum.FixedPrice,
  fixedPrice: '0.1234',
  fixedSpread: '0.0100',
  revenueShareRatio: 10,
  comment: 'old-remark',
})

describe('PriceGroupWidget', () => {
  it('clears dependent fields when priceModel changes', async () => {
    const wrapper = mount(PriceGroupWidget, {
      props: {
        modelValue: createModelValue(),
        path: 'signInfo',
      },
    })

    await wrapper.setProps({
      modelValue: {
        ...createModelValue(),
        priceModel: PriceModelEnum.Other,
      },
    })
    await nextTick()

    const emitted = wrapper.emitted('update:modelValue') || []
    expect(emitted.length).toBeGreaterThan(0)

    const payload = emitted[emitted.length - 1][0] as Record<string, unknown>
    expect(payload.priceType).toBeNull()
    expect(payload.priceCategory).toBeNull()
    expect(payload.fixedPrice).toBeNull()
    expect(payload.fixedSpread).toBeNull()
    expect(payload.revenueShareRatio).toBeNull()
    expect(payload.comment).toBeNull()
  })

  it('shows comment field only when priceModel is Other', async () => {
    const wrapper = mount(PriceGroupWidget, {
      props: {
        modelValue: {
          ...createModelValue(),
          priceModel: PriceModelEnum.Other,
          priceType: null,
          priceCategory: null,
          fixedPrice: null,
          fixedSpread: null,
          revenueShareRatio: null,
          comment: 'initial',
        },
        path: 'signInfo',
      },
    })

    expect(wrapper.find('[data-path="signInfo.comment"]').exists()).toBe(true)
    expect(wrapper.find('[data-path="signInfo.priceType"]').exists()).toBe(false)
    expect(wrapper.find('[data-path="signInfo.priceCategory"]').exists()).toBe(false)

    await wrapper.get('[data-test="n-input"]').trigger('click')

    const emitted = wrapper.emitted('update:modelValue') || []
    const payload = emitted[emitted.length - 1][0] as Record<string, unknown>
    expect(payload.comment).toBe('remark-updated')
  })

  it('updates share ratio when category is ShareRatio', async () => {
    const wrapper = mount(PriceGroupWidget, {
      props: {
        modelValue: {
          ...createModelValue(),
          priceModel: PriceModelEnum.RevenueShare,
          priceCategory: PriceCategoryEnum.ShareRatio,
          fixedPrice: null,
          fixedSpread: null,
          revenueShareRatio: 66,
        },
        path: 'signInfo',
      },
    })

    expect(wrapper.find('[data-path="signInfo.revenueShareRatio"]').exists()).toBe(true)
    expect(wrapper.find('[data-path="signInfo.fixedPrice"]').exists()).toBe(false)
    expect(wrapper.find('[data-path="signInfo.fixedSpread"]').exists()).toBe(false)

    await wrapper.get('[data-test="n-input-number"]').trigger('click')

    const emitted = wrapper.emitted('update:modelValue') || []
    const payload = emitted[emitted.length - 1][0] as Record<string, unknown>
    expect(payload.revenueShareRatio).toBe(88)
  })
})
