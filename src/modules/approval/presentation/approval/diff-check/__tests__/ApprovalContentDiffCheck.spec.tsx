import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

const {
  useFilesDetailQuerySpy,
  buildServiceAgreementDiffCheckFieldsSpy,
  toServiceAgreementDiffCheckFormSpy,
  findPathInTreeSpy,
} = vi.hoisted(() => ({
  useFilesDetailQuerySpy: vi.fn(),
  buildServiceAgreementDiffCheckFieldsSpy: vi.fn(),
  toServiceAgreementDiffCheckFormSpy: vi.fn(),
  findPathInTreeSpy: vi.fn(),
}))

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('@/modules/file/application/hooks/useFileService', () => ({
  useFilesDetailQuery: useFilesDetailQuerySpy,
}))

vi.mock('@/modules/shared/presentation/utils', () => ({
  findPathInTree: findPathInTreeSpy,
}))

vi.mock('@/modules/service-agreement/presentation/diff-check/serviceAgreementDiffCheck', () => ({
  buildServiceAgreementDiffCheckFields: buildServiceAgreementDiffCheckFieldsSpy,
  toServiceAgreementDiffCheckForm: toServiceAgreementDiffCheckFormSpy,
}))

vi.mock('@/modules/shared/presentation/diff-check/components/unified/UnifiedFormTable', () => ({
  default: defineComponent({
    name: 'MockUnifiedFormTable',
    props: {
      variant: {
        type: String,
        required: false,
      },
      fields: {
        type: Array,
        required: false,
      },
      data: {
        type: Object,
        required: false,
      },
      oldData: {
        type: Object,
        required: false,
      },
      showOnlyChanged: {
        type: Boolean,
        required: false,
      },
      disableListToggle: {
        type: Boolean,
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'unified-form-table',
          'data-props': JSON.stringify({
            variant: props.variant,
            fields: props.fields,
            data: props.data,
            oldData: props.oldData ?? null,
            showOnlyChanged: props.showOnlyChanged,
            disableListToggle: props.disableListToggle,
          }),
        })
    },
  }),
}))

import ApprovalContentDiffCheck from '@/modules/approval/presentation/approval/diff-check/ApprovalContentDiffCheck'

describe('ApprovalContentDiffCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useFilesDetailQuerySpy.mockReturnValue({
      data: {
        value: [],
      },
    })

    buildServiceAgreementDiffCheckFieldsSpy.mockReturnValue([
      { key: 'companyName', label: '企业名称', type: 'text' },
    ])

    toServiceAgreementDiffCheckFormSpy.mockImplementation((model: Record<string, unknown>) => ({
      mappedFromId: model.id,
      contractScanFilesLength: (model.contractScanFiles as unknown[] | undefined)?.length || 0,
      billFilesLength: (model.billFiles as unknown[] | undefined)?.length || 0,
      supplementaryAttachmentFilesLength:
        (model.supplementaryAttachmentFiles as unknown[] | undefined)?.length || 0,
    }))

    findPathInTreeSpy.mockReturnValue([{ label: '浙江' }, { label: '杭州' }])
  })

  it('uses user-additional-info branch and converts field labels/values', () => {
    const wrapper = mount(ApprovalContentDiffCheck, {
      props: {
        data: {
          processName: '用户信息审批',
          approvalData: {
            registerType: 2,
            name: '张三',
            pca: '330100',
          },
          sourceData: {
            registerType: 1,
            name: '企业A',
            pca: '330100',
          },
        } as never,
        variant: 'screen',
        showOnlyChanged: true,
        disableListToggle: false,
      },
    })

    const propsData = JSON.parse(
      wrapper.get('[data-test="unified-form-table"]').attributes('data-props') || '{}',
    )

    expect(propsData.variant).toBe('screen')
    expect(propsData.showOnlyChanged).toBe(true)
    expect(propsData.disableListToggle).toBe(false)

    expect(propsData.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'registerType', label: 'domain.user.field.registerType' }),
        expect.objectContaining({ key: 'name', label: 'domain.user.field.name' }),
        expect.objectContaining({ key: 'pca', label: 'domain.user.field.region' }),
      ]),
    )

    expect(propsData.data.registerType).toBe('common.options.registerType.individual')
    expect(propsData.data.name).toBe('张三')
    expect(propsData.data.pca).toBe('浙江-杭州')

    expect(propsData.oldData.registerType).toBe('common.options.registerType.company')
    expect(propsData.oldData.name).toBe('企业A')
  })

  it('uses service-agreement branch and maps files by ids', () => {
    useFilesDetailQuerySpy.mockReturnValue({
      data: {
        value: [
          { id: 1, fileName: 'a.pdf' },
          { id: 2, fileName: 'b.pdf' },
          { id: 3, fileName: 'c.pdf' },
          { id: 4, fileName: 'd.pdf' },
        ],
      },
    })

    const approvalData = {
      id: 10,
      companyName: '审批新值',
      billIds: [1, 2],
      contractScanIds: [3],
      supplementaryAttachmentIds: [],
    }
    const sourceData = {
      id: 9,
      companyName: '审批旧值',
      billIds: [2, 4],
      contractScanIds: [],
      supplementaryAttachmentIds: [],
    }

    const wrapper = mount(ApprovalContentDiffCheck, {
      props: {
        data: {
          processName: '备案/签约信息审批',
          approvalData,
          sourceData,
        } as never,
        variant: 'print',
        showOnlyChanged: true,
        disableListToggle: false,
      },
    })

    const allFileIdsRef = useFilesDetailQuerySpy.mock.calls[0][0] as { value: number[] }
    expect(allFileIdsRef.value).toEqual([2, 4, 1, 3])

    expect(buildServiceAgreementDiffCheckFieldsSpy).toHaveBeenCalledTimes(1)
    expect(toServiceAgreementDiffCheckFormSpy).toHaveBeenCalledTimes(2)

    const firstCallModel = toServiceAgreementDiffCheckFormSpy.mock.calls[0][0]
    const secondCallModel = toServiceAgreementDiffCheckFormSpy.mock.calls[1][0]

    expect(firstCallModel.contractScanFiles).toEqual([{ id: 3, fileName: 'c.pdf' }])
    expect(firstCallModel.billFiles).toEqual([
      { id: 1, fileName: 'a.pdf' },
      { id: 2, fileName: 'b.pdf' },
    ])
    expect(secondCallModel.billFiles).toEqual([
      { id: 2, fileName: 'b.pdf' },
      { id: 4, fileName: 'd.pdf' },
    ])

    const propsData = JSON.parse(
      wrapper.get('[data-test="unified-form-table"]').attributes('data-props') || '{}',
    )
    expect(propsData.variant).toBe('print')
    expect(propsData.showOnlyChanged).toBe(false)
    expect(propsData.disableListToggle).toBe(true)

    expect(propsData.fields).toEqual([{ key: 'companyName', label: '企业名称', type: 'text' }])
    expect(propsData.data).toEqual(
      expect.objectContaining({
        mappedFromId: 10,
        billFilesLength: 2,
        contractScanFilesLength: 1,
      }),
    )
    expect(propsData.oldData).toEqual(
      expect.objectContaining({
        mappedFromId: 9,
        billFilesLength: 2,
      }),
    )
  })
})
