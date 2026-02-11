import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'

const {
  mapFileIdsMock,
  useDistributeFilesMock,
  useFilesDetailQueryMock,
  toViewServiceAgreementRequestMock,
  uniqMock,
} = vi.hoisted(() => ({
  mapFileIdsMock: vi.fn(),
  useDistributeFilesMock: vi.fn(),
  useFilesDetailQueryMock: vi.fn(),
  toViewServiceAgreementRequestMock: vi.fn(),
  uniqMock: vi.fn(),
}))

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('lodash', () => ({
  uniq: uniqMock,
}))

vi.mock('@/modules/approval/application/print/FileListDiff', () => ({
  mapFileIds: mapFileIdsMock,
  useDistributeFiles: useDistributeFilesMock,
}))

vi.mock('@/modules/file/application/hooks/useFileService', () => ({
  useFilesDetailQuery: useFilesDetailQueryMock,
}))

vi.mock('@/modules/service-agreement/application/mappers', () => ({
  toViewServiceAgreementRequest: toViewServiceAgreementRequestMock,
}))

vi.mock('@/modules/service-agreement/presentation/print/ServiceAgreementPrint', () => ({
  default: defineComponent({
    name: 'MockServiceAgreementPrint',
    props: {
      data: {
        type: Object,
        required: false,
      },
      compareData: {
        type: Object,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'div',
          {
            'data-test': 'service-print',
            'data-data': JSON.stringify(props.data ?? null),
            'data-compare': JSON.stringify(props.compareData ?? null),
          },
          slots.attachments?.(),
        )
    },
  }),
}))

vi.mock('@/modules/service-agreement/presentation/print/ServiceAgreementAttachmentPrint', () => ({
  default: defineComponent({
    name: 'MockServiceAgreementAttachmentPrint',
    props: {
      id: {
        type: Number,
        required: true,
      },
      data: {
        type: Object,
        required: false,
      },
      compareData: {
        type: Object,
        required: false,
      },
      rules: {
        type: Array,
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'attachment-print',
          'data-id': String(props.id),
          'data-data': JSON.stringify(props.data ?? null),
          'data-compare': JSON.stringify(props.compareData ?? null),
          'data-rules-count': String((props.rules || []).length),
        })
    },
  }),
}))

vi.mock('@/modules/service-agreement/presentation/sign/AttachmentApprovalDiff', () => ({
  default: defineComponent({
    name: 'MockAttachmentApprovalDiff',
    props: {
      filesMap: {
        type: Object,
        required: false,
      },
      rules: {
        type: Array,
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'attachment-approval-diff',
          'data-files-map': JSON.stringify(props.filesMap ?? null),
          'data-rules-count': String((props.rules || []).length),
        })
    },
  }),
}))

import SignDiffTemplate from '@/modules/service-agreement/presentation/print/SignDiffTemplate'

const mockedFilesMap = {
  old: {
    billIds: [{ id: 10 }],
    contractScanIds: [{ id: 11 }],
    supplementaryAttachmentIds: [{ id: 12 }],
  },
  new: {
    billIds: [{ id: 20 }],
    contractScanIds: [{ id: 21 }],
    supplementaryAttachmentIds: [{ id: 22 }],
  },
}

describe('SignDiffTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mapFileIdsMock.mockImplementation((source: Record<string, number[]>) => {
      return [
        ...(source.billIds || []),
        ...(source.contractScanIds || []),
        ...(source.supplementaryAttachmentIds || []),
      ]
    })
    uniqMock.mockImplementation((items: number[]) => Array.from(new Set(items)))

    useFilesDetailQueryMock.mockReturnValue({
      data: ref([]),
    })

    useDistributeFilesMock.mockReturnValue(
      computed(() => mockedFilesMap as never),
    )

    toViewServiceAgreementRequestMock.mockImplementation((dto: Record<string, unknown>) => ({
      ...dto,
      view: true,
    }))
  })

  it('collects unique file ids and passes mapped view props to child components', () => {
    const approvalData = {
      billIds: [2, 4],
      contractScanIds: [5],
      supplementaryAttachmentIds: [],
    }
    const sourceData = {
      billIds: [1, 2],
      contractScanIds: [3],
      supplementaryAttachmentIds: [],
    }

    const wrapper = mount(SignDiffTemplate, {
      props: {
        data: {
          id: 101,
          approvalData: approvalData as never,
          sourceData: sourceData as never,
        } as never,
      },
    })

    const allIdsRef = useFilesDetailQueryMock.mock.calls[0][0] as { value: number[] }
    expect(allIdsRef.value).toEqual([1, 2, 3, 4, 5])

    expect(mapFileIdsMock).toHaveBeenCalledTimes(2)
    expect(uniqMock).toHaveBeenCalledWith([1, 2, 3, 2, 4, 5])

    expect(toViewServiceAgreementRequestMock).toHaveBeenCalledTimes(2)
    expect(toViewServiceAgreementRequestMock).toHaveBeenNthCalledWith(1, approvalData)
    expect(toViewServiceAgreementRequestMock).toHaveBeenNthCalledWith(2, sourceData)

    const servicePrint = wrapper.find('[data-test="service-print"]')
    expect(servicePrint.exists()).toBe(true)
    expect(JSON.parse(servicePrint.attributes('data-data') ?? 'null')).toEqual(
      expect.objectContaining({ view: true }),
    )
    expect(JSON.parse(servicePrint.attributes('data-compare') ?? 'null')).toEqual(
      expect.objectContaining({ view: true }),
    )

    const attachmentPrint = wrapper.find('[data-test="attachment-print"]')
    expect(attachmentPrint.exists()).toBe(true)
    expect(attachmentPrint.attributes('data-id')).toBe('101')
    expect(JSON.parse(attachmentPrint.attributes('data-data') ?? 'null')).toEqual({
      billFiles: [{ id: 20 }],
      contractScanFiles: [{ id: 21 }],
      supplementaryAttachmentFiles: [{ id: 22 }],
    })
    expect(JSON.parse(attachmentPrint.attributes('data-compare') ?? 'null')).toEqual({
      billFiles: [{ id: 10 }],
      contractScanFiles: [{ id: 11 }],
      supplementaryAttachmentFiles: [{ id: 12 }],
    })
    expect(attachmentPrint.attributes('data-rules-count')).toBe('3')

    const attachmentDiff = wrapper.find('[data-test="attachment-approval-diff"]')
    expect(attachmentDiff.exists()).toBe(true)
    expect(attachmentDiff.attributes('data-rules-count')).toBe('3')
    expect(JSON.parse(attachmentDiff.attributes('data-files-map') ?? 'null')).toEqual(mockedFilesMap)
  })

  it('renders with null compareData when sourceData is null', () => {
    const approvalData = {
      billIds: [2],
      contractScanIds: [],
      supplementaryAttachmentIds: [],
    }

    const wrapper = mount(SignDiffTemplate, {
      props: {
        data: {
          id: 102,
          approvalData: approvalData as never,
          sourceData: null,
        } as never,
      },
    })

    expect(toViewServiceAgreementRequestMock).toHaveBeenCalledTimes(1)
    expect(toViewServiceAgreementRequestMock).toHaveBeenCalledWith(approvalData)

    const servicePrint = wrapper.find('[data-test="service-print"]')
    expect(JSON.parse(servicePrint.attributes('data-compare') ?? 'null')).toBeNull()
  })
})
