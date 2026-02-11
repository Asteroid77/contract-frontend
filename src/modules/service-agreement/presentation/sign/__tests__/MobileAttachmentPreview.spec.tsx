import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

import MobileAttachmentPreview from '@/modules/service-agreement/presentation/sign/MobileAttachmentPreview'

describe('MobileAttachmentPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(window as any).open = vi.fn(() => null)
  })

  it('renders empty state when no attachment ids exist', () => {
    const wrapper = mount(MobileAttachmentPreview, {
      props: {
        agreementData: {
          companyName: '测试公司',
          companyArea: '杭州',
          contractScanIds: null,
          billIds: null,
          supplementaryAttachmentIds: null,
        },
        files: [],
      },
    })

    expect(wrapper.text()).toContain('domain.agreement.preview.noAttachmentsData')
    expect(wrapper.findAll('.file-card')).toHaveLength(0)
  })

  it('groups attachments by ids and opens pdf in new window', async () => {
    const wrapper = mount(MobileAttachmentPreview, {
      props: {
        agreementData: {
          companyName: '测试公司',
          companyArea: '杭州',
          contractScanIds: [2],
          billIds: [1],
          supplementaryAttachmentIds: [3],
        },
        files: [
          {
            id: 1,
            fileName: 'bill.pdf',
            fileType: 'application/pdf',
            path: 'https://oss/bill.pdf',
          },
          {
            id: 2,
            fileName: 'contract.jpg',
            fileType: 'image/jpeg',
            path: 'https://oss/contract.jpg',
          },
          {
            id: 3,
            fileName: 'other.png',
            fileType: 'image/png',
            path: 'https://oss/other.png',
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('domain.agreement.file.contract')
    expect(wrapper.text()).toContain('domain.agreement.file.bill')
    expect(wrapper.text()).toContain('domain.agreement.file.other')

    const cards = wrapper.findAll('.file-card')
    expect(cards).toHaveLength(3)

    await cards[1].trigger('click')

    expect((window as any).open).toHaveBeenCalledWith('https://oss/bill.pdf', '_blank')
  })

  it('opens and closes image viewer for image file click', async () => {
    const wrapper = mount(MobileAttachmentPreview, {
      props: {
        agreementData: {
          companyName: '测试公司',
          companyArea: '杭州',
          contractScanIds: [1],
          billIds: null,
          supplementaryAttachmentIds: null,
        },
        files: [
          {
            id: 1,
            fileName: 'contract.jpg',
            fileType: 'image/jpeg',
            path: 'https://oss/contract.jpg',
          },
        ],
      },
    })

    const card = wrapper.find('.file-card')
    expect(card.exists()).toBe(true)

    await card.trigger('click')

    const viewer = wrapper.find('.image-viewer')
    expect(viewer.exists()).toBe(true)
    expect(wrapper.find('.image-viewer img').attributes('src')).toBe('https://oss/contract.jpg')

    await viewer.trigger('click')
    expect(wrapper.find('.image-viewer').exists()).toBe(false)
  })
})
