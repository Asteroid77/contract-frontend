import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  previewDataRef,
  previewLoadingRef,
  validateErrorsRef,
  capturedEnabledRef,
  capturedParamsRef,
} = vi.hoisted(() => ({
  previewDataRef: {
    value: null as any,
  },
  previewLoadingRef: {
    value: false,
  },
  validateErrorsRef: {
    value: null as any,
  },
  capturedEnabledRef: {
    value: null as any,
  },
  capturedParamsRef: {
    value: null as any,
  },
}))

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => key,
}))

vi.mock('@/modules/service-agreement/application/hooks/useSignService', () => ({
  usePreviewAttachments: vi.fn((paramsRef, enabledRef) => {
    capturedParamsRef.value = paramsRef
    capturedEnabledRef.value = enabledRef

    return {
      data: previewDataRef,
      isLoading: previewLoadingRef,
    }
  }),
}))

vi.mock('@/modules/service-agreement/application/validation', () => ({
  previewAttachmentsRule: {},
}))

vi.mock('@/modules/shared/presentation/widget/AppFormItem', () => ({
  default: defineComponent({
    name: 'AppFormItem',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'app-form-item' }, slots.default?.())
    },
  }),
}))

vi.mock('@/modules/service-agreement/presentation/sign/AttachmentApprovalDiff', () => ({
  default: defineComponent({
    name: 'AttachmentApprovalDiff',
    props: {
      filesMap: {
        type: Object,
        required: true,
      },
      rules: {
        type: Array,
        required: true,
      },
    },
    setup(props) {
      return () =>
        h('section', {
          'data-test': 'attachment-approval-diff',
          'data-rules-len': String((props.rules || []).length),
          'data-old-kind': props.filesMap?.old === undefined ? 'undefined' : props.filesMap?.old === null ? 'null' : 'object',
          'data-new-kind': props.filesMap?.new === undefined ? 'undefined' : props.filesMap?.new === null ? 'null' : 'object',
        })
    },
  }),
}))

vi.mock('naive-ui', () => ({
  NResult: defineComponent({
    name: 'NResult',
    props: {
      title: {
        type: String,
        required: false,
      },
      description: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('div', { 'data-test': 'n-result', 'data-title': props.title, 'data-description': props.description }, [
          slots.footer?.(),
        ])
    },
  }),
  NForm: defineComponent({
    name: 'NForm',
    setup(_, { slots, expose }) {
      expose({
        validate: (callback: (errors: unknown) => void) => {
          callback(validateErrorsRef.value)
        },
      })

      return () => h('form', { 'data-test': 'n-form' }, slots.default?.())
    },
  }),
  NInput: defineComponent({
    name: 'NInput',
    props: {
      value: {
        type: String,
        required: false,
      },
      onUpdateValue: {
        type: Function,
        required: false,
      },
    },
    setup(props) {
      return () => h('input', { value: props.value })
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    props: {
      onClick: {
        type: Function,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () => h('button', { onClick: props.onClick }, slots.default?.())
    },
  }),
}))

import PreviewAttachmentsView from '@/views/unauth/PreviewAttachments'
import { PreviewTypeEnum } from '@/modules/service-agreement/application/constants'

describe('PreviewAttachments view', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    previewLoadingRef.value = false
    previewDataRef.value = null
    validateErrorsRef.value = null
    capturedEnabledRef.value = null
    capturedParamsRef.value = null
  })

  it('renders access result panel when preview data is missing', () => {
    const wrapper = mount(PreviewAttachmentsView, {
      props: {
        id: 11,
        type: PreviewTypeEnum.FORM_VIEW as 1,
      },
    })

    expect(wrapper.find('[data-test="n-result"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="attachment-approval-diff"]').exists()).toBe(false)
    expect(capturedParamsRef.value?.value).toEqual({
      id: 11,
      type: PreviewTypeEnum.FORM_VIEW as 1,
      code: undefined,
    })
  })

  it('enables preview query when validation passes and access button is clicked', async () => {
    const wrapper = mount(PreviewAttachmentsView, {
      props: {
        id: 22,
        type: PreviewTypeEnum.FORM_VIEW as 1,
      },
    })

    expect(capturedEnabledRef.value.value).toBe(false)

    const accessBtn = wrapper.get('button')
    await accessBtn.trigger('click')

    expect(capturedEnabledRef.value.value).toBe(true)
  })

  it('keeps preview query disabled when validation has errors', async () => {
    validateErrorsRef.value = [[{ field: 'code' }]]

    const wrapper = mount(PreviewAttachmentsView, {
      props: {
        id: 22,
        type: PreviewTypeEnum.FORM_VIEW as 1,
      },
    })

    expect(capturedEnabledRef.value.value).toBe(false)

    const accessBtn = wrapper.get('button')
    await accessBtn.trigger('click')

    expect(capturedEnabledRef.value.value).toBe(false)
  })

  it('maps old files to undefined for FORM_VIEW when oldFiles are absent', () => {
    previewDataRef.value = {
      newFiles: {
        billFiles: [],
        contractScanFiles: [],
        supplementaryAttachmentFiles: [],
      },
    }

    const wrapper = mount(PreviewAttachmentsView, {
      props: {
        id: 33,
        type: PreviewTypeEnum.FORM_VIEW as 1,
      },
    })

    const diff = wrapper.get('[data-test="attachment-approval-diff"]')
    expect(diff.attributes('data-old-kind')).toBe('undefined')
    expect(diff.attributes('data-new-kind')).toBe('object')
    expect(diff.attributes('data-rules-len')).toBe('3')
  })

  it('maps old files to null for APPROVAL_VIEW when oldFiles are absent', () => {
    previewDataRef.value = {
      newFiles: {
        billFiles: [],
        contractScanFiles: [],
        supplementaryAttachmentFiles: [],
      },
    }

    const wrapper = mount(PreviewAttachmentsView, {
      props: {
        id: 44,
        type: PreviewTypeEnum.APPROVAL_VIEW as 2,
      },
    })

    const diff = wrapper.get('[data-test="attachment-approval-diff"]')
    expect(diff.attributes('data-old-kind')).toBe('null')
  })
})
