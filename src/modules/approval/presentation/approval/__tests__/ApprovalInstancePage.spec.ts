import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

type MockDataTableColumn = {
  key?: string
  render?: (row: Record<string, unknown>) => unknown
}

const {
  routerPushSpy,
  claimMutateSpy,
  refetchSpy,
  canClaimTaskSpy,
  isApprovalFinishSpy,
  isApproveBtnVisibleSpy,
  showIncompletedUserNameSpy,
  statusTagFactorySpy,
} = vi.hoisted(() => ({
  routerPushSpy: vi.fn(),
  claimMutateSpy: vi.fn(),
  refetchSpy: vi.fn(),
  canClaimTaskSpy: vi.fn(),
  isApprovalFinishSpy: vi.fn(),
  isApproveBtnVisibleSpy: vi.fn(),
  showIncompletedUserNameSpy: vi.fn(),
  statusTagFactorySpy: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPushSpy,
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('naive-ui', () => ({
  NButton: defineComponent({
    name: 'NButton',
    props: {
      size: {
        type: String,
        required: false,
      },
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
            'data-size': props.size ?? '',
            'data-type': props.type ?? '',
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
  NDataTable: defineComponent({
    name: 'NDataTable',
    props: {
      columns: {
        type: Array,
        required: false,
      },
      data: {
        type: Array,
        required: false,
      },
      loading: {
        type: Boolean,
        required: false,
      },
      pagination: {
        type: Object,
        required: false,
      },
      bordered: {
        type: Boolean,
        required: false,
      },
      singleLine: {
        type: Boolean,
        required: false,
      },
    },
    setup(props) {
      return () => {
        const columns = (props.columns || []) as MockDataTableColumn[]
        const rows = (props.data || []) as Array<Record<string, unknown>>
        const operateColumn = columns.find((column) => column.key === 'operate')

        return h(
          'div',
          {
            'data-test': 'n-data-table',
            'data-loading': String(Boolean(props.loading)),
          },
          rows.map((row, index) =>
            h('div', { 'data-test': 'n-data-row', 'data-index': String(index) }, [
              h('span', { 'data-test': 'process-name' }, String(row.processName ?? '')),
              operateColumn?.render
                ? h('div', { 'data-test': 'operate-cell' }, [operateColumn.render(row) as never])
                : null,
            ]),
          ),
        )
      }
    },
  }),
}))

vi.mock('@/modules/approval/application/hooks/useApprovalService', () => ({
  useApprovalInstancePage: () => ({
    data: {
      value: {
        records: [
          {
            id: 1,
            processName: '流程A',
            nodeName: '节点A',
            status: 'handling',
            taskStatus: 'pending',
            assigneeName: '审批人A',
            applicantName: '申请人A',
            createdTime: '2026-01-01T10:00:00+08:00',
            taskId: 88,
          },
        ],
      },
    },
    isLoading: {
      value: false,
    },
    refetch: refetchSpy,
  }),
  useClaimTask: () => ({
    mutate: claimMutateSpy,
  }),
}))

vi.mock('@/modules/approval/application/utils', () => ({
  canClaimTask: canClaimTaskSpy,
  isApprovalFinish: isApprovalFinishSpy,
  isApproveBtnVisible: isApproveBtnVisibleSpy,
  showIncompletedUserName: showIncompletedUserNameSpy,
}))

vi.mock('@/modules/user/application/stores/useAccountStore', () => ({
  useAccountStore: () => ({
    account: {
      userId: 7,
    },
  }),
}))

vi.mock('@/modules/shared/presentation/time', () => ({
  formatted: vi.fn((value: string) => ({
    standard: `fmt:${value}`,
  })),
}))

vi.mock('@/modules/shared/presentation/advanced-query', () => ({
  ModernQueryBuilder: defineComponent({
    name: 'ModernQueryBuilder',
    setup() {
      return () => h('div', { 'data-test': 'modern-query-builder' })
    },
  }),
  QueryActionButtons: defineComponent({
    name: 'QueryActionButtons',
    emits: ['search', 'reset'],
    setup(_, { emit }) {
      return () =>
        h('div', { 'data-test': 'query-action-buttons' }, [
          h(
            'button',
            {
              'data-test': 'n-button',
              onClick: () => emit('search'),
            },
            'common.action.search',
          ),
          h(
            'button',
            {
              'data-test': 'n-button',
              onClick: () => emit('reset'),
            },
            'common.action.reset',
          ),
        ])
    },
  }),
}))

vi.mock('@/modules/approval/presentation/approval/StatusTag', () => ({
  default: (status: string) => {
    statusTagFactorySpy(status)
    return defineComponent({
      name: 'MockStatusTag',
      setup() {
        return () => h('span', { 'data-test': 'status-tag' }, status)
      },
    })
  },
}))

import ApprovalInstancePage from '@/modules/approval/presentation/approval/ApprovalInstancePage.vue'

describe('ApprovalInstancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    canClaimTaskSpy.mockReturnValue({ canClaim: true })
    isApprovalFinishSpy.mockReturnValue(false)
    isApproveBtnVisibleSpy.mockReturnValue(true)
    showIncompletedUserNameSpy.mockImplementation((name?: string) => name ?? '-')
  })

  it('forces refetch on search/reset when page is first and query unchanged', async () => {
    const wrapper = mount(ApprovalInstancePage)

    const searchBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('common.action.search'))
    const resetBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('common.action.reset'))

    expect(searchBtn).toBeTruthy()
    expect(resetBtn).toBeTruthy()

    await searchBtn!.trigger('click')
    await resetBtn!.trigger('click')

    expect(refetchSpy).toHaveBeenCalledTimes(2)
  })

  it('handles approve route jump and claim action from operate column', async () => {
    const wrapper = mount(ApprovalInstancePage)

    const approveBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('common.action.approve'))

    expect(approveBtn).toBeTruthy()
    await approveBtn!.trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith({
      name: 'approval-instance-detail',
      query: {
        template: '流程A',
        instanceId: 1,
      },
    })

    const claimPositive = wrapper.get('[data-test="n-popconfirm-positive"]')
    await claimPositive.trigger('click')

    expect(claimMutateSpy).toHaveBeenCalledWith(88)
  })
})
