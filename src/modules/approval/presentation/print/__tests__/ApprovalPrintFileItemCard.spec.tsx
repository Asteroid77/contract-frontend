import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('naive-ui', () => ({
  NTag: defineComponent({
    name: 'NTag',
    props: {
      type: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('span', { 'data-test': 'n-tag', 'data-type': props.type ?? '' }, slots.default?.())
    },
  }),
  NImage: defineComponent({
    name: 'NImage',
    props: {
      src: {
        type: String,
        required: false,
      },
      previewSrc: {
        type: String,
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('img', {
          'data-test': 'n-image',
          'data-src': props.src ?? '',
          'data-preview-src': props.previewSrc ?? '',
        })
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
  FilePdfOutlined: defineComponent({
    name: 'FilePdfOutlined',
    setup() {
      return () => h('span', { 'data-test': 'pdf-icon' })
    },
  }),
}))

import ApprovalPrintFileItemCard from '@/modules/approval/presentation/print/ApprovalPrintFileItemCard'

describe('ApprovalPrintFileItemCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(window, 'open').mockImplementation(() => null)
  })

  it('renders image preview and added status badge for image file', () => {
    const wrapper = mount(ApprovalPrintFileItemCard, {
      props: {
        file: {
          id: 1,
          fileName: 'test.png',
          accessUrl: 'https://zwlh-powergrid.oss-cn-guangzhou.aliyuncs.com/test.png',
        } as never,
        status: 'added',
      },
    })

    const image = wrapper.get('[data-test="n-image"]')
    expect(image.attributes('data-src')).toBe(
      'https://zwlh-powergrid.oss-cn-guangzhou.aliyuncs.com/test.png',
    )
    expect(image.attributes('data-preview-src')).toBe(
      'https://zwlh-powergrid.oss-cn-guangzhou.aliyuncs.com/test.png',
    )

    const tag = wrapper.get('[data-test="n-tag"]')
    expect(tag.attributes('data-type')).toBe('success')
    expect(tag.text()).toBe('common.action.add')
  })

  it('renders pdf placeholder and opens new tab on click for non-image', async () => {
    const wrapper = mount(ApprovalPrintFileItemCard, {
      props: {
        file: {
          id: 2,
          fileName: 'manual.pdf',
          accessUrl: 'https://oss-cn-guangzhou.aliyuncs.com/manual.pdf',
        } as never,
        status: 'removed',
      },
    })

    expect(wrapper.find('[data-test="n-image"]').exists()).toBe(false)

    const tag = wrapper.get('[data-test="n-tag"]')
    expect(tag.attributes('data-type')).toBe('error')
    expect(tag.text()).toBe('common.action.delete')

    await wrapper.get('.file-diff-card__pdf-placeholder').trigger('click')
    expect(window.open).toHaveBeenCalledWith(
      'https://oss-cn-guangzhou.aliyuncs.com/manual.pdf',
      '_blank',
    )
  })

  it('does not open invalid external PDF URLs', async () => {
    const wrapper = mount(ApprovalPrintFileItemCard, {
      props: {
        file: {
          id: 3,
          fileName: 'blocked.pdf',
          accessUrl: 'https://evil.example/blocked.pdf',
        } as never,
        status: 'normal',
      },
    })

    await wrapper.get('.file-diff-card__pdf-placeholder').trigger('click')
    expect(window.open).not.toHaveBeenCalled()
  })

  it('does not pass invalid image URLs into image preview props', () => {
    const wrapper = mount(ApprovalPrintFileItemCard, {
      props: {
        file: {
          id: 4,
          fileName: 'blocked.png',
          accessUrl: 'javascript:alert(1)',
        } as never,
        status: 'normal',
      },
    })

    const image = wrapper.get('[data-test="n-image"]')
    expect(image.attributes('data-src')).toBe('')
    expect(image.attributes('data-preview-src')).toBe('')
  })
})
