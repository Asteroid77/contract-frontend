import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

const {
  dialogCreateSpy,
  handleTaskMutateSpy,
  cancelMutateSpy,
  claimMutateSpy,
  printSpy,
  routerGoSpy,
  isApproveBtnVisibleSpy,
  isCancelAccessibleSpy,
  isClaimBtnVisibleSpy,
} = vi.hoisted(() => ({
  dialogCreateSpy: vi.fn(),
  handleTaskMutateSpy: vi.fn(),
  cancelMutateSpy: vi.fn(),
  claimMutateSpy: vi.fn(),
  printSpy: vi.fn(),
  routerGoSpy: vi.fn(),
  isApproveBtnVisibleSpy: vi.fn(),
  isCancelAccessibleSpy: vi.fn(),
  isClaimBtnVisibleSpy: vi.fn(),
}))

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('@/_utils/discrete_naive_api', () => ({
  dialog: {
    create: dialogCreateSpy,
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    go: routerGoSpy,
  }),
}))

vi.mock('@/modules/approval/application/hooks/useApprovalService', () => ({
  useHandleTask: () => ({
    mutate: handleTaskMutateSpy,
  }),
  useCancelApprovalInstance: () => ({
    mutate: cancelMutateSpy,
  }),
  useClaimTask: () => ({
    mutate: claimMutateSpy,
  }),
}))

vi.mock('@/modules/approval/application/validation', () => ({
  approvalOpinionRequestRule: vi.fn(() => ({})),
}))

vi.mock('@/modules/user/application/stores/useAccountStore', () => ({
  useAccountStore: () => ({
    profile: {
      userId: 99,
    },
  }),
}))

vi.mock('@/modules/approval/application/hooks/usePrint', () => ({
  usePrint: () => ({
    print: printSpy,
  }),
}))

vi.mock('@/modules/approval/application/utils', () => ({
  isApproveBtnVisible: isApproveBtnVisibleSpy,
  isCancelAccessible: isCancelAccessibleSpy,
  isClaimBtnVisible: isClaimBtnVisibleSpy,
}))

vi.mock('naive-ui', () => ({
  NButton: defineComponent({
    name: 'NButton',
    props: {
      type: {
        type: String,
        required: false,
      },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            'data-test': 'n-button',
            'data-type': props.type || '',
            onClick: () => emit('click'),
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
  NPopconfirm: defineComponent({
    name: 'NPopconfirm',
    emits: ['positive-click'],
    setup(_, { emit, slots }) {
      return () =>
        h('div', { 'data-test': 'n-popconfirm' }, [
          h('div', { 'data-test': 'n-popconfirm-trigger' }, slots.trigger?.()),
          h(
            'button',
            {
              'data-test': 'n-popconfirm-positive',
              onClick: () => emit('positive-click'),
            },
            'positive',
          ),
          h('div', { 'data-test': 'n-popconfirm-content' }, slots.default?.()),
        ])
    },
  }),
  NForm: defineComponent({
    name: 'NForm',
    setup(_, { slots }) {
      return () => h('form', { 'data-test': 'n-form' }, slots.default?.())
    },
  }),
  NFormItem: defineComponent({
    name: 'NFormItem',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-form-item' }, slots.default?.())
    },
  }),
  NInput: defineComponent({
    name: 'NInput',
    setup() {
      return () => h('textarea', { 'data-test': 'n-input' })
    },
  }),
  NRadio: defineComponent({
    name: 'NRadio',
    setup(_, { slots }) {
      return () => h('label', { 'data-test': 'n-radio' }, slots.default?.())
    },
  }),
  NRadioGroup: defineComponent({
    name: 'NRadioGroup',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-radio-group' }, slots.default?.())
    },
  }),
}))

import TemplateActions from '@/modules/approval/presentation/approval/TemplateActions'

const approvalInstance = {
  id: 101,
  processId: 1,
  processName: '用户信息审批',
  formId: 9,
  currentNodeId: 2,
  nodeName: '节点A',
  status: 'handling',
  applicantId: 99,
  approvalData: {},
  sourceData: null,
  createdTime: '2026-02-10T10:00:00+08:00',
  taskStatus: 'pending',
  taskId: 808,
}

describe('TemplateActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isApproveBtnVisibleSpy.mockReturnValue(true)
    isCancelAccessibleSpy.mockReturnValue(true)
    isClaimBtnVisibleSpy.mockReturnValue(true)
  })

  it('renders visible actions and triggers claim/cancel/print/back handlers', async () => {
    const wrapper = mount(TemplateActions, {
      props: {
        data: approvalInstance as never,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('common.action.claim')
    expect(text).toContain('common.action.approve')
    expect(text).toContain('common.action.print')
    expect(text).toContain('common.action.cancel')
    expect(text).toContain('common.action.back')

    const approveBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('common.action.approve'))
    expect(approveBtn).toBeTruthy()
    await approveBtn!.trigger('click')

    expect(dialogCreateSpy).toHaveBeenCalledTimes(1)
    const dialogConfig = dialogCreateSpy.mock.calls[0][0]
    expect(dialogConfig.title).toBe('domain.approval.section.opinion')
    expect(dialogConfig.positiveText).toBe('common.action.submit')
    expect(dialogConfig.negativeText).toBe('common.action.cancel')

    const printBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('common.action.print'))
    await printBtn!.trigger('click')
    expect(printSpy).toHaveBeenCalledWith('printable-approval-area')

    const backBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('common.action.back'))
    await backBtn!.trigger('click')
    expect(routerGoSpy).toHaveBeenCalledWith(-1)

    const positives = wrapper.findAll('[data-test="n-popconfirm-positive"]')
    expect(positives).toHaveLength(2)

    await positives[0].trigger('click')
    expect(claimMutateSpy).toHaveBeenCalledWith(808)

    await positives[1].trigger('click')
    expect(cancelMutateSpy).toHaveBeenCalledWith(101)
  })

  it('does not call claim mutation when taskId is missing', async () => {
    const wrapper = mount(TemplateActions, {
      props: {
        data: {
          ...approvalInstance,
          taskId: undefined,
        } as never,
      },
    })

    const positives = wrapper.findAll('[data-test="n-popconfirm-positive"]')
    expect(positives).toHaveLength(2)

    await positives[0].trigger('click')
    expect(claimMutateSpy).not.toHaveBeenCalled()
  })

  it('hides claim/approve/cancel buttons when visibility guards are false', () => {
    isApproveBtnVisibleSpy.mockReturnValue(false)
    isCancelAccessibleSpy.mockReturnValue(false)
    isClaimBtnVisibleSpy.mockReturnValue(false)

    const wrapper = mount(TemplateActions, {
      props: {
        data: approvalInstance as never,
      },
    })

    const text = wrapper.text()

    expect(text).not.toContain('common.action.claim')
    expect(text).not.toContain('common.action.approve')
    expect(text).not.toContain('common.action.cancel')
    expect(text).toContain('common.action.print')
    expect(text).toContain('common.action.back')

    expect(wrapper.findAll('[data-test="n-popconfirm"]')).toHaveLength(0)
  })
})
