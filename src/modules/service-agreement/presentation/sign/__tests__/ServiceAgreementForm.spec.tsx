import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

const { validateErrorsState, createModelSpy } = vi.hoisted(() => ({
  validateErrorsState: {
    value: null as unknown,
  },
  createModelSpy: vi.fn((initialValue?: { status?: number }) => ({
    customerInfo: {
      status: initialValue?.status ?? 1,
    },
    signInfo: {
      marker: 'sign-info',
    },
    attachmentInfo: {
      contractScanIds: [],
      billIds: [],
      supplementaryAttachmentIds: [],
    },
  })),
}))

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('naive-ui', () => ({
  NForm: defineComponent({
    name: 'NForm',
    setup(_, { slots, expose }) {
      expose({
        validate: (callback: (errors: unknown) => void) => {
          callback(validateErrorsState.value)
        },
      })

      return () => h('form', { 'data-test': 'n-form' }, slots.default?.())
    },
  }),
  NCollapse: defineComponent({
    name: 'NCollapse',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-collapse' }, slots.default?.())
    },
  }),
  NCollapseItem: defineComponent({
    name: 'NCollapseItem',
    props: {
      name: {
        type: String,
        required: false,
      },
      title: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('section', { 'data-test': 'n-collapse-item', 'data-name': props.name ?? '' }, [
          h('div', { 'data-test': 'n-collapse-header' }, slots.header?.() ?? props.title ?? ''),
          h('div', { 'data-test': 'n-collapse-content' }, slots.default?.()),
        ])
    },
  }),
  NPopover: defineComponent({
    name: 'NPopover',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-popover' }, [slots.trigger?.(), slots.default?.()])
    },
  }),
  NText: defineComponent({
    name: 'NText',
    setup(_, { slots }) {
      return () => h('span', { 'data-test': 'n-text' }, slots.default?.())
    },
  }),
  NIcon: defineComponent({
    name: 'NIcon',
    setup(_, { slots }) {
      return () => h('i', { 'data-test': 'n-icon' }, slots.default?.())
    },
  }),
}))

vi.mock('@vicons/antd', () => ({
  WarningOutlined: defineComponent({
    name: 'WarningOutlined',
    setup() {
      return () => h('span', { 'data-test': 'warning-icon' })
    },
  }),
}))

vi.mock('@/modules/service-agreement/application/ui-mappers', () => ({
  createServiceAgreementModel: createModelSpy,
}))

vi.mock('@/modules/service-agreement/application/validation', () => ({
  createServiceAgreementRules: vi.fn(() => ({})),
}))

vi.mock('@/modules/service-agreement/presentation/sign/CustomerInfoSection', () => ({
  default: defineComponent({
    name: 'CustomerInfoSection',
    setup() {
      return () => h('div', { 'data-test': 'customer-info-section' })
    },
  }),
}))

vi.mock('@/modules/service-agreement/presentation/sign/SignInfoSection', () => ({
  default: defineComponent({
    name: 'SignInfoSection',
    setup() {
      return () => h('div', { 'data-test': 'sign-info-section' })
    },
  }),
}))

vi.mock('@/modules/service-agreement/presentation/sign/AttachmentSection', () => ({
  default: defineComponent({
    name: 'AttachmentSection',
    setup() {
      return () => h('div', { 'data-test': 'attachment-section' })
    },
  }),
}))

vi.mock('@/modules/shared/presentation/widget/FormSkeleton', () => ({
  default: defineComponent({
    name: 'FormSkeleton',
    setup() {
      return () => h('div', { 'data-test': 'form-skeleton' })
    },
  }),
}))

import ServiceAgreementForm from '@/modules/service-agreement/presentation/sign/ServiceAgreementForm'
import { ServiceAgreementStatusEnum } from '@/modules/service-agreement/application/constants'

describe('ServiceAgreementForm', () => {
  it('shows sign and attachment sections only when status is Sign', () => {
    const signWrapper = mount(ServiceAgreementForm, {
      props: {
        initialValue: {
          status: ServiceAgreementStatusEnum.Sign,
        } as never,
      },
    })

    expect(signWrapper.find('[data-test="customer-info-section"]').exists()).toBe(true)
    expect(signWrapper.find('[data-test="sign-info-section"]').exists()).toBe(true)
    expect(signWrapper.find('[data-test="attachment-section"]').exists()).toBe(true)

    const recordWrapper = mount(ServiceAgreementForm, {
      props: {
        initialValue: {
          status: ServiceAgreementStatusEnum.Record,
        } as never,
      },
    })

    expect(recordWrapper.find('[data-test="customer-info-section"]').exists()).toBe(true)
    expect(recordWrapper.find('[data-test="sign-info-section"]').exists()).toBe(false)
    expect(recordWrapper.find('[data-test="attachment-section"]').exists()).toBe(false)
  })

  it('exposes handleValidate in Button slot and returns validate result', async () => {
    let slotPayload: any = null

    mount(ServiceAgreementForm, {
      props: {
        initialValue: {
          status: ServiceAgreementStatusEnum.Sign,
        } as never,
      },
      slots: {
        Button: (payload: { handleValidate: () => Promise<boolean>; formValue: unknown }) => {
          slotPayload = payload
          return h('div', { 'data-test': 'button-slot' })
        },
      },
    })

    if (!slotPayload) {
      throw new Error('slot payload missing')
    }
    expect(slotPayload.formValue).toBeTruthy()

    validateErrorsState.value = [[{ field: 'customerInfo.companyName' }]]
    const invalidResult = await slotPayload.handleValidate()
    expect(invalidResult).toBe(false)

    validateErrorsState.value = null
    const validResult = await slotPayload.handleValidate()
    expect(validResult).toBe(true)
  })
})
