import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  routerPushSpy,
  printSpy,
  recordMutateSpy,
  signMutateSpy,
  convertSpy,
  buildFieldsSpy,
  toDiffFormSpy,
  detailDataRef,
  detailLoadingRef,
  formValueRef,
  validateResultRef,
  recordCallbackRef,
  signCallbackRef,
} = vi.hoisted(() => ({
  routerPushSpy: vi.fn(),
  printSpy: vi.fn(),
  recordMutateSpy: vi.fn(),
  signMutateSpy: vi.fn(),
  convertSpy: vi.fn(),
  buildFieldsSpy: vi.fn(() => [{ key: 'companyName' }]),
  toDiffFormSpy: vi.fn((detail) => ({ mappedId: detail?.id ?? null })),
  detailDataRef: { value: null as any },
  detailLoadingRef: { value: false },
  formValueRef: {
    value: {
      customerInfo: {
        status: 1,
      },
      signInfo: {},
      attachmentInfo: {},
    } as any,
  },
  validateResultRef: { value: true },
  recordCallbackRef: { value: undefined as ((resp: any) => void) | undefined },
  signCallbackRef: { value: undefined as ((resp: any) => void) | undefined },
}))

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => key,
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPushSpy,
  }),
}))

vi.mock('naive-ui', () => ({
  NButton: defineComponent({
    name: 'NButton',
    props: {
      onClick: {
        type: Function,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'button',
          {
            onClick: props.onClick,
          },
          slots.default?.(),
        )
    },
  }),
  NSpace: defineComponent({
    name: 'NSpace',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-space' }, slots.default?.())
    },
  }),
}))

vi.mock('@/modules/approval/application/hooks/usePrint', () => ({
  usePrint: vi.fn(() => ({
    print: printSpy,
  })),
}))

vi.mock('@/modules/service-agreement/application/hooks/useSignService', () => ({
  useServiceAgreementDetail: vi.fn(() => ({
    data: detailDataRef,
    isLoading: detailLoadingRef,
  })),
  useSubmitRecordMutation: vi.fn((callback?: (resp: any) => void) => {
    recordCallbackRef.value = callback
    return {
      mutate: recordMutateSpy,
      isPending: { value: false },
    }
  }),
  useSubmitSignMutation: vi.fn((callback?: (resp: any) => void) => {
    signCallbackRef.value = callback
    return {
      mutate: signMutateSpy,
      isPending: { value: false },
    }
  }),
}))

vi.mock('@/modules/service-agreement/application/ui-mappers', () => ({
  convertUIToRequestDTO: convertSpy,
}))

vi.mock('@/modules/service-agreement/presentation/sign/ServiceAgreementForm', () => ({
  default: defineComponent({
    name: 'ServiceAgreementFormStub',
    props: {
      initialValue: {
        required: false,
      },
      loading: {
        type: Boolean,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('section', {
          'data-test': 'service-agreement-form',
          'data-loading': String(Boolean(props.loading)),
          'data-initial-status': String((props.initialValue as { status?: number } | undefined)?.status ?? ''),
        }, [
          slots.Button?.({
            formValue: formValueRef.value,
            handleValidate: () => Promise.resolve(validateResultRef.value),
          }),
        ])
    },
  }),
}))

vi.mock('@/modules/shared/presentation/diff-check/components/print/UnifiedFormPrint', () => ({
  default: defineComponent({
    name: 'UnifiedFormPrint',
    props: {
      title: {
        type: String,
        required: false,
      },
      docNo: {
        type: String,
        required: false,
      },
      previewUrl: {
        type: String,
        required: false,
      },
      fields: {
        type: Array,
        required: false,
      },
      data: {
        required: false,
      },
      oldData: {
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'unified-form-print',
          'data-title': props.title,
          'data-doc-no': props.docNo,
          'data-preview-url': props.previewUrl,
          'data-fields-len': String((props.fields || []).length),
          'data-data': JSON.stringify(props.data),
          'data-old-data': props.oldData == null ? 'null' : JSON.stringify(props.oldData),
        })
    },
  }),
}))

vi.mock('@/modules/service-agreement/presentation/diff-check/serviceAgreementDiffCheck', () => ({
  buildServiceAgreementDiffCheckFields: buildFieldsSpy,
  toServiceAgreementDetailDiffCheckForm: toDiffFormSpy,
}))

import ServiceAgreementDetailView from '@/views/auth/ServiceAgreementDetailView'
import {
  PreviewTypeEnum,
  ServiceAgreementStatusEnum,
} from '@/modules/service-agreement/application/constants'

describe('ServiceAgreementDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    detailLoadingRef.value = false
    detailDataRef.value = {
      id: 200,
      status: ServiceAgreementStatusEnum.Record,
    }

    formValueRef.value = {
      customerInfo: {
        status: ServiceAgreementStatusEnum.Record,
      },
      signInfo: {},
      attachmentInfo: {},
    }

    validateResultRef.value = true
    convertSpy.mockReturnValue({ dto: 'converted' })

    recordCallbackRef.value = undefined
    signCallbackRef.value = undefined
  })

  it('submits record mutation when status is Record and validation passes', async () => {
    const wrapper = mount(ServiceAgreementDetailView, {
      props: {
        id: 66,
      },
    })

    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')

    expect(convertSpy).toHaveBeenCalledWith(formValueRef.value)
    expect(recordMutateSpy).toHaveBeenCalledWith({ dto: 'converted' })
    expect(signMutateSpy).not.toHaveBeenCalled()
  })

  it('submits sign mutation when status is Sign', async () => {
    formValueRef.value.customerInfo.status = ServiceAgreementStatusEnum.Sign

    const wrapper = mount(ServiceAgreementDetailView, {
      props: {
        id: 66,
      },
    })

    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')

    expect(signMutateSpy).toHaveBeenCalledWith({ dto: 'converted' })
    expect(recordMutateSpy).not.toHaveBeenCalled()
  })

  it('skips submit when validation fails', async () => {
    validateResultRef.value = false

    const wrapper = mount(ServiceAgreementDetailView, {
      props: {
        id: 66,
      },
    })

    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')

    expect(convertSpy).not.toHaveBeenCalled()
    expect(recordMutateSpy).not.toHaveBeenCalled()
    expect(signMutateSpy).not.toHaveBeenCalled()
  })

  it('calls print helper with fixed printable id', async () => {
    const wrapper = mount(ServiceAgreementDetailView, {
      props: {
        id: 66,
      },
    })

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')

    expect(printSpy).toHaveBeenCalledWith('printable-approval-area')
  })

  it('pushes sign-result route when record callback is triggered', () => {
    mount(ServiceAgreementDetailView, {
      props: {
        id: 66,
      },
    })

    recordCallbackRef.value?.({
      id: 123,
    })

    expect(routerPushSpy).toHaveBeenCalledWith({
      path: '/auth/sign/result',
      query: {
        id: '123',
        status: String(ServiceAgreementStatusEnum.Record),
      },
    })
  })

  it('pushes sign-result route when sign callback is triggered', () => {
    mount(ServiceAgreementDetailView, {
      props: {
        id: 66,
      },
    })

    signCallbackRef.value?.({
      id: 456,
    })

    expect(routerPushSpy).toHaveBeenCalledWith({
      path: '/auth/sign/result',
      query: {
        id: '456',
        status: String(ServiceAgreementStatusEnum.Sign),
      },
    })
  })

  it('renders hidden UnifiedFormPrint when initial detail exists', () => {
    const wrapper = mount(ServiceAgreementDetailView, {
      props: {
        id: 66,
      },
    })

    const print = wrapper.find('[data-test="unified-form-print"]')
    expect(print.exists()).toBe(true)
    expect(print.attributes('data-doc-no')).toBe('66')
    expect(print.attributes('data-preview-url')).toBe(
      `${window.location.origin}/sign/preview/attachments?id=66&type=${PreviewTypeEnum.FORM_VIEW}`,
    )
    expect(print.attributes('data-fields-len')).toBe('1')
    expect(toDiffFormSpy).toHaveBeenCalledWith(detailDataRef.value)
  })

  it('does not render UnifiedFormPrint when detail data is null', () => {
    detailDataRef.value = null

    const wrapper = mount(ServiceAgreementDetailView, {
      props: {
        id: 66,
      },
    })

    expect(wrapper.find('[data-test="unified-form-print"]').exists()).toBe(false)
  })
})
