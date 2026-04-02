import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

const { renderAttachmentRowsMock } = vi.hoisted(() => ({
  renderAttachmentRowsMock: vi.fn(() => null),
}))

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('naive-ui', () => ({
  NQrCode: defineComponent({
    name: 'MockNQrCode',
    props: {
      value: {
        type: String,
        required: false,
      },
    },
    setup(props) {
      return () => h('div', { 'data-test': 'qr-code' }, props.value ?? '')
    },
  }),
}))

vi.mock('@/modules/approval/application/print/FileListDiff', () => ({
  renderAttachmentRows: renderAttachmentRowsMock,
}))

import ServiceAgreementAttachmentPrint from '@/modules/service-agreement/presentation/print/ServiceAgreementAttachmentPrint'

const createFiles = (id: number) => [
  {
    id,
    fileName: `file-${id}.pdf`,
    fileType: 'application/pdf',
    sourceType: {
      code: 'OSS',
      description: 'oss',
    },
    ossRegion: 'cn-hangzhou',
    ossBucket: 'bucket',
    ossObjectKey: `obj/${id}`,
    fileSize: 1024,
    fileHash: `hash-${id}`,
    uploadTime: '2026-02-10T10:00:00+08:00',
    uploader: 1,
    description: null,
    status: {
      code: 'OK',
      description: 'ok',
    },
    expireTime: Date.now() + 60 * 1000,
    accessUrl: `https://oss/${id}.pdf`,
  },
]

const baseProps = {
  id: 10,
  data: {
    billFiles: createFiles(1),
    contractScanFiles: createFiles(2),
    supplementaryAttachmentFiles: createFiles(3),
  },
  rules: [
    {
      title: '电费单',
      key: 'billFiles',
    },
    {
      title: '合同扫描件',
      key: 'contractScanFiles',
    },
  ] as Array<{
    title: string
    key: 'billFiles' | 'contractScanFiles' | 'supplementaryAttachmentFiles'
  }>,
}

describe('ServiceAgreementAttachmentPrint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    renderAttachmentRowsMock.mockReturnValue(null)
  })

  it('renders form-view qr url when compareData is undefined', () => {
    const wrapper = mount(ServiceAgreementAttachmentPrint, {
      props: {
        ...baseProps,
      },
    })

    const qr = wrapper.find('[data-test="qr-code"]')
    expect(qr.exists()).toBe(true)
    expect(qr.text()).toContain('/sign/preview/attachments?id=10&type=1')

    const section = wrapper.find('section')
    expect(section.classes()).not.toContain('in-approval-mode')

    expect(renderAttachmentRowsMock).toHaveBeenCalledTimes(2)
    expect(renderAttachmentRowsMock).toHaveBeenNthCalledWith(
      1,
      '电费单',
      baseProps.data.billFiles,
      undefined,
      false,
    )
  })

  it('switches to approval-view mode when compareData is present', () => {
    const wrapper = mount(ServiceAgreementAttachmentPrint, {
      props: {
        ...baseProps,
        compareData: {
          billFiles: [],
          contractScanFiles: [],
          supplementaryAttachmentFiles: [],
        },
      },
    })

    const qr = wrapper.find('[data-test="qr-code"]')
    expect(qr.text()).toContain('/sign/preview/attachments?id=10&type=2')

    const section = wrapper.find('section')
    expect(section.classes()).toContain('in-approval-mode')

    expect(renderAttachmentRowsMock).toHaveBeenNthCalledWith(
      1,
      '电费单',
      baseProps.data.billFiles,
      [],
      true,
    )
  })

  it('shows no-data row when both new/old files are empty', () => {
    const wrapper = mount(ServiceAgreementAttachmentPrint, {
      props: {
        ...baseProps,
        data: {
          billFiles: [],
          contractScanFiles: [],
          supplementaryAttachmentFiles: [],
        },
      },
    })

    expect(wrapper.text()).toContain('common.label.noData')
  })
})
