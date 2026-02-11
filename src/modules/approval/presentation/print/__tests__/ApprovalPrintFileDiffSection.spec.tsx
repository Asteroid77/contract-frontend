import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('naive-ui', () => ({
  NGrid: defineComponent({
    name: 'NGrid',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-grid' }, slots.default?.())
    },
  }),
  NGi: defineComponent({
    name: 'NGi',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-gi' }, slots.default?.())
    },
  }),
}))

vi.mock('@/modules/approval/presentation/print/ApprovalPrintFileItemCard', () => ({
  default: defineComponent({
    name: 'FileItemCard',
    props: {
      file: {
        type: Object,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'file-item-card',
          'data-id': String((props.file as Record<string, unknown>).id ?? ''),
          'data-status': props.status,
        })
    },
  }),
}))

import ApprovalPrintFileDiffSection from '@/modules/approval/presentation/print/ApprovalPrintFileDiffSection'

const f = (id: number) => ({ id, fileName: `${id}.png`, accessUrl: `https://cdn/${id}.png` }) as never

describe('ApprovalPrintFileDiffSection', () => {
  it('renders normal list when approvalType is false', () => {
    const wrapper = mount(ApprovalPrintFileDiffSection, {
      props: {
        title: '附件',
        approvalType: false,
        newData: [f(1), f(2)],
      },
    })

    expect(wrapper.find('.section-title').text()).toBe('附件')

    const cards = wrapper.findAll('[data-test="file-item-card"]')
    expect(cards).toHaveLength(2)
    expect(cards[0].attributes('data-status')).toBe('normal')
    expect(cards[1].attributes('data-status')).toBe('normal')
  })

  it('renders removed/added/kept diff groups when approvalType is true', () => {
    const wrapper = mount(ApprovalPrintFileDiffSection, {
      props: {
        title: '附件差异',
        approvalType: true,
        oldData: [f(1), f(2)],
        newData: [f(2), f(3)],
      },
    })

    expect(wrapper.find('.sub-section-title').text()).toBe('附件差异')

    const cards = wrapper.findAll('[data-test="file-item-card"]')
    expect(cards).toHaveLength(3)

    const byStatus = cards.map((node) => node.attributes('data-status'))
    expect(byStatus).toEqual(['removed', 'added', 'kept'])
  })

  it('renders nothing when no file exists in all groups', () => {
    const wrapper = mount(ApprovalPrintFileDiffSection, {
      props: {
        title: '空',
        approvalType: true,
        oldData: [],
        newData: [],
      },
    })

    expect(wrapper.find('[data-test="n-grid"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="file-item-card"]').exists()).toBe(false)
    expect(wrapper.text()).toBe('')
  })
})
