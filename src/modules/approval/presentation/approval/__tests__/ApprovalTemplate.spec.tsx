import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

const {
  detailDataRef,
  detailLoadingRef,
  historyDataRef,
  routerGoSpy,
} = vi.hoisted(() => ({
  detailDataRef: { value: undefined as unknown },
  detailLoadingRef: { value: false },
  historyDataRef: { value: undefined as unknown },
  routerGoSpy: vi.fn(),
}))

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    go: routerGoSpy,
  }),
}))

vi.mock('@/modules/approval/application/hooks/useApprovalService', () => ({
  useApprovalInstanceDetail: vi.fn(() => ({
    data: detailDataRef,
    isLoading: detailLoadingRef,
  })),
  useApprovalHistoryQuery: vi.fn(() => ({
    data: historyDataRef,
  })),
}))

vi.mock('naive-ui', () => ({
  NButton: defineComponent({
    name: 'NButton',
    emits: ['click'],
    setup(_, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            'data-test': 'n-button',
            onClick: () => emit('click'),
          },
          slots.default?.(),
        )
    },
  }),
  NCheckbox: defineComponent({
    name: 'NCheckbox',
    props: {
      checked: {
        type: Boolean,
        default: false,
      },
      onUpdateChecked: {
        type: Function,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'button',
          {
            'data-test': 'n-checkbox',
            'data-checked': String(props.checked),
            onClick: () => {
              ;(props as any).onUpdateChecked?.(!props.checked)
            },
          },
          slots.default?.(),
        )
    },
  }),
  NFlex: defineComponent({
    name: 'NFlex',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-flex' }, slots.default?.())
    },
  }),
  NSkeleton: defineComponent({
    name: 'NSkeleton',
    setup() {
      return () => h('div', { 'data-test': 'n-skeleton' })
    },
  }),
  NResult: defineComponent({
    name: 'NResult',
    props: {
      status: {
        type: String,
        required: false,
      },
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
        h('div', {
          'data-test': 'n-result',
          'data-status': props.status,
          'data-title': props.title,
          'data-description': props.description,
        }, [slots.footer?.()])
    },
  }),
}))

vi.mock('@/modules/shared/presentation/diff-check/DiffCheckScope', () => ({
  default: defineComponent({
    name: 'MockDiffCheckScope',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'diff-check-scope' }, slots.default?.())
    },
  }),
}))

vi.mock('@/modules/approval/presentation/approval/diff-check/ApprovalBaseInfoDiffCheck', () => ({
  default: defineComponent({
    name: 'MockApprovalBaseInfoDiffCheck',
    setup() {
      return () => h('div', { 'data-test': 'approval-base' })
    },
  }),
}))

vi.mock('@/modules/approval/presentation/approval/diff-check/ApprovalContentDiffCheck', () => ({
  default: defineComponent({
    name: 'MockApprovalContentDiffCheck',
    props: {
      showOnlyChanged: {
        type: Boolean,
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'approval-content',
          'data-show-only': String(props.showOnlyChanged),
        })
    },
  }),
}))

vi.mock('@/modules/approval/presentation/approval/diff-check/ApprovalHistoryDiffCheck', () => ({
  default: defineComponent({
    name: 'MockApprovalHistoryDiffCheck',
    props: {
      list: {
        type: Array,
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'approval-history',
          'data-list': JSON.stringify(props.list || []),
        })
    },
  }),
}))

vi.mock('@/modules/approval/presentation/approval/diff-check/ApprovalPrintDiffCheck', () => ({
  default: defineComponent({
    name: 'MockApprovalPrintDiffCheck',
    props: {
      historyList: {
        type: Array,
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'approval-print',
          'data-history': JSON.stringify(props.historyList || []),
        })
    },
  }),
}))

vi.mock('@/modules/approval/presentation/approval/TemplateActions', () => ({
  default: defineComponent({
    name: 'MockTemplateActions',
    setup() {
      return () => h('div', { 'data-test': 'template-actions' })
    },
  }),
}))

import ApprovalTemplate from '@/modules/approval/presentation/approval/ApprovalTemplate'

const createDetail = (sourceData: Record<string, unknown> | null) => ({
  id: 101,
  processId: 1,
  processName: '用户信息审批',
  formId: 9,
  currentNodeId: 2,
  nodeName: '节点A',
  status: 'pending',
  applicantId: 66,
  approvalData: {},
  sourceData,
  createdTime: '2026-02-10T10:00:00+08:00',
  taskStatus: 'pending',
  taskId: 808,
})

describe('ApprovalTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    detailLoadingRef.value = false
    detailDataRef.value = undefined
    historyDataRef.value = undefined
  })

  it('renders loading skeletons when detail is loading', () => {
    detailLoadingRef.value = true
    detailDataRef.value = undefined

    const wrapper = mount(ApprovalTemplate, {
      props: {
        instanceId: 101,
        template: '用户信息审批',
      },
    })

    expect(wrapper.find('[data-test="n-flex"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test="n-skeleton"]').length).toBeGreaterThan(0)
    expect(wrapper.find('[data-test="n-result"]').exists()).toBe(false)
  })

  it('renders error result and back action when detail loading failed', async () => {
    detailLoadingRef.value = false
    detailDataRef.value = undefined

    const wrapper = mount(ApprovalTemplate, {
      props: {
        instanceId: 101,
        template: '用户信息审批',
      },
    })

    const result = wrapper.find('[data-test="n-result"]')
    expect(result.exists()).toBe(true)
    expect(result.attributes('data-status')).toBe('500')
    expect(result.attributes('data-title')).toBe('common.error.pageLoad')

    const backBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('common.action.back'))
    expect(backBtn).toBeTruthy()
    await backBtn!.trigger('click')

    expect(routerGoSpy).toHaveBeenCalledWith(-1)
  })

  it('renders detail blocks and toggles showOnlyChanged in diff mode', async () => {
    detailLoadingRef.value = false
    detailDataRef.value = createDetail({ id: 99 })
    historyDataRef.value = [
      {
        id: 1,
        instanceId: 101,
        taskId: 1,
        nodeId: 1,
        nodeName: '原节点1',
        operator: '张三',
        operatorId: 1,
        action: 'cancel',
        createdTime: '2026-02-10T10:00:00+08:00',
        comment: '',
      },
      {
        id: 2,
        instanceId: 101,
        taskId: 2,
        nodeId: 2,
        nodeName: '原节点2',
        operator: '李四',
        operatorId: 2,
        action: 'approve',
        createdTime: '2026-02-11T10:00:00+08:00',
        comment: '同意',
      },
    ]

    const wrapper = mount(ApprovalTemplate, {
      props: {
        instanceId: 101,
        template: '用户信息审批',
      },
    })

    expect(wrapper.find('[data-test="diff-check-scope"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="approval-base"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="approval-content"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="approval-history"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="template-actions"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="approval-print"]').exists()).toBe(true)

    expect(wrapper.text()).toContain('common.action.view')
    expect(wrapper.text()).toContain('domain.approval.section.content')
    expect(wrapper.text()).toContain('common.action.modify')

    const checkbox = wrapper.find('[data-test="n-checkbox"]')
    expect(checkbox.exists()).toBe(true)
    expect(wrapper.find('[data-test="approval-content"]').attributes('data-show-only')).toBe('false')

    await checkbox.trigger('click')
    await nextTick()

    expect(wrapper.find('[data-test="approval-content"]').attributes('data-show-only')).toBe('true')

    const historyPayload = JSON.parse(
      wrapper.find('[data-test="approval-history"]').attributes('data-list') || '[]',
    )
    expect(historyPayload[0].nodeName).toBe('domain.approval.history.withdraw')
    expect(historyPayload[1].nodeName).toBe('domain.approval.history.submit')

    const printHistoryPayload = JSON.parse(
      wrapper.find('[data-test="approval-print"]').attributes('data-history') || '[]',
    )
    expect(printHistoryPayload[0].nodeName).toBe('domain.approval.history.withdraw')
    expect(printHistoryPayload[1].nodeName).toBe('domain.approval.history.submit')
  })
})
