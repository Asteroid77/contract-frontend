import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('naive-ui', () => ({
  NEmpty: defineComponent({
    name: 'NEmpty',
    props: {
      description: {
        type: String,
        required: false,
      },
    },
    setup(props) {
      return () => h('div', { 'data-test': 'n-empty', 'data-desc': props.description || '' })
    },
  }),
}))

vi.mock('@/modules/approval/presentation/print/ApprovalPrintFileDiffSection', () => ({
  default: defineComponent({
    name: 'MockFileDiffSection',
    props: {
      title: {
        type: String,
        required: false,
      },
      oldData: {
        type: Array,
        required: false,
      },
      newData: {
        type: Array,
        required: false,
      },
      approvalType: {
        type: Boolean,
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'file-diff-section',
          'data-title': props.title || '',
          'data-old-len': String((props.oldData || []).length),
          'data-new-len': String((props.newData || []).length),
          'data-approval-type': String(props.approvalType),
        })
    },
  }),
}))

import AttachmentApprovalDiff from '@/modules/service-agreement/presentation/sign/AttachmentApprovalDiff'

describe('AttachmentApprovalDiff', () => {
  it('renders file diff sections and sets approvalType by old-files existence', () => {
    const wrapper = mount(AttachmentApprovalDiff, {
      props: {
        filesMap: {
          old: undefined,
          new: {
            billIds: [{ id: 1 } as never],
            contractScanIds: [],
          },
        },
        rules: [
          { title: '电费单', key: 'billIds' },
          { title: '合同', key: 'contractScanIds' },
        ],
      },
    })

    const sections = wrapper.findAll('[data-test="file-diff-section"]')
    expect(sections).toHaveLength(2)

    expect(sections[0].attributes('data-title')).toBe('电费单')
    expect(sections[0].attributes('data-new-len')).toBe('1')
    expect(sections[0].attributes('data-approval-type')).toBe('false')

    expect(sections[1].attributes('data-title')).toBe('合同')
    expect(sections[1].attributes('data-new-len')).toBe('0')

    expect(wrapper.find('[data-test="n-empty"]').exists()).toBe(false)
  })

  it('shows empty state when all configured file groups are empty', () => {
    const wrapper = mount(AttachmentApprovalDiff, {
      props: {
        filesMap: {
          old: {
            billIds: [],
            contractScanIds: [],
          },
          new: {
            billIds: [],
            contractScanIds: [],
          },
        },
        rules: [
          { title: '电费单', key: 'billIds' },
          { title: '合同', key: 'contractScanIds' },
        ],
      },
    })

    const empty = wrapper.find('[data-test="n-empty"]')
    expect(empty.exists()).toBe(true)
    expect(empty.attributes('data-desc')).toBe('common.label.noData')
  })
})
