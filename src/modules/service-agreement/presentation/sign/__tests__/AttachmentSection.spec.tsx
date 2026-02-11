import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('naive-ui', () => ({
  NGrid: defineComponent({
    name: 'NGrid',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-grid' }, slots.default?.())
    },
  }),
  NFormItemGi: defineComponent({
    name: 'NFormItemGi',
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
            'data-test': 'n-form-item-gi',
            'data-label': props.label ?? '',
            'data-path': props.path ?? '',
          },
          slots.default?.(),
        )
    },
  }),
}))

vi.mock('@/modules/service-agreement/presentation/sign/ImagesUploader', () => ({
  default: defineComponent({
    name: 'ImagesUploader',
    props: {
      value: {
        type: Array,
        required: false,
      },
      fileCategory: {
        type: String,
        required: false,
      },
      maxFiles: {
        type: Number,
        required: false,
      },
      initialFileList: {
        type: Array,
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-test': 'images-uploader',
          'data-file-category': props.fileCategory ?? '',
          'data-value-len': String((props.value || []).length),
          'data-initial-len': String((props.initialFileList || []).length),
          'data-max-files': String(props.maxFiles ?? ''),
          onClick: () => emit('update:value', [999]),
        })
    },
  }),
}))

import AttachmentSection from '@/modules/service-agreement/presentation/sign/AttachmentSection'
import { FileCategoryEnum } from '@/modules/service-agreement/application/constants'

describe('AttachmentSection', () => {
  it('renders three uploaders with mapped config and default paths', () => {
    const wrapper = mount(AttachmentSection, {
      props: {
        modelValue: {
          contractScanIds: [1],
          billIds: [2, 3],
          supplementaryAttachmentIds: [],
        },
        initialValue: {
          contractScanFiles: [{ id: 11 } as never],
          billFiles: [{ id: 21 } as never, { id: 22 } as never],
          supplementaryAttachmentFiles: [],
        },
      },
    })

    const uploaders = wrapper.findAll('[data-test="images-uploader"]')
    expect(uploaders).toHaveLength(3)

    expect(uploaders[0].attributes('data-file-category')).toBe(FileCategoryEnum.CONTRACT)
    expect(uploaders[0].attributes('data-initial-len')).toBe('1')
    expect(uploaders[0].attributes('data-max-files')).toBe('3')

    expect(uploaders[1].attributes('data-file-category')).toBe(FileCategoryEnum.BILL)
    expect(uploaders[1].attributes('data-initial-len')).toBe('2')

    expect(uploaders[2].attributes('data-file-category')).toBe(FileCategoryEnum.ATTACHMENT)
    expect(uploaders[2].attributes('data-initial-len')).toBe('0')

    expect(wrapper.find('[data-path="attachmentInfo.contractScanIds"]').exists()).toBe(true)
    expect(wrapper.find('[data-path="attachmentInfo.billIds"]').exists()).toBe(true)
    expect(wrapper.find('[data-path="attachmentInfo.supplementaryAttachmentIds"]').exists()).toBe(
      true,
    )
  })

  it('emits merged model when uploader updates one file group', async () => {
    const wrapper = mount(AttachmentSection, {
      props: {
        modelValue: {
          contractScanIds: [1],
          billIds: [2],
          supplementaryAttachmentIds: [3],
        },
      },
    })

    await wrapper
      .find(`[data-test="images-uploader"][data-file-category="${FileCategoryEnum.BILL}"]`)
      .trigger('click')

    const emitted = wrapper.emitted('update:modelValue') || []
    expect(emitted.length).toBeGreaterThan(0)

    const payload = emitted[0][0] as Record<string, unknown>
    expect(payload.contractScanIds).toEqual([1])
    expect(payload.billIds).toEqual([999])
    expect(payload.supplementaryAttachmentIds).toEqual([3])
  })
})
