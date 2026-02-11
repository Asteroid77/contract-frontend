import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('@/modules/approval/application/utils', () => ({
  showIncompletedUserName: vi.fn((name: string) => `masked:${name}`),
}))

vi.mock('@/modules/shared/presentation/time', () => ({
  formatted: vi.fn((value: string) => ({
    standard: `formatted:${value}`,
  })),
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

vi.mock('@/modules/approval/presentation/approval/diff-check/ApprovalContentDiffCheck', () => ({
  default: defineComponent({
    name: 'MockApprovalContentDiffCheck',
    props: {
      variant: {
        type: String,
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
          'data-test': 'approval-content-diff',
          'data-variant': props.variant,
          'data-disable-list-toggle': String(props.disableListToggle),
        })
    },
  }),
}))

import ApprovalPrintDiffCheck from '@/modules/approval/presentation/approval/diff-check/ApprovalPrintDiffCheck'

describe('ApprovalPrintDiffCheck', () => {
  it('renders finished status, qr preview url and history action rows', () => {
    const wrapper = mount(ApprovalPrintDiffCheck, {
      props: {
        data: {
          id: 101,
          processName: '用户信息审批',
          nodeName: '节点A',
          applicantName: '张三',
          assigneeName: '李四',
          status: 'approved',
          taskStatus: 'handling',
        } as never,
        historyList: [
          {
            id: 1,
            instanceId: 101,
            taskId: 1001,
            nodeId: 2001,
            operatorId: 88,
            nodeName: '审批节点',
            operator: '王五',
            action: 'approve',
            createdTime: '2026-02-10T10:00:00+08:00',
            comment: '',
          },
        ],
      },
    })

    const text = wrapper.text()

    expect(text).toContain('domain.approval.status.approved')
    expect(text).not.toContain('domain.approval.status.processing')

    expect(text).toContain('masked:张三')
    expect(text).toContain('masked:李四')
    expect(text).toContain('masked:王五')

    expect(text).toContain('domain.approval.action.pass')
    expect(text).toContain('formatted:2026-02-10T10:00:00+08:00')
    expect(text).toContain('-')

    const qr = wrapper.find('[data-test="qr-code"]')
    expect(qr.exists()).toBe(true)
    expect(qr.text()).toContain('/sign/preview/attachments?id=101&type=2')

    const content = wrapper.find('[data-test="approval-content-diff"]')
    expect(content.exists()).toBe(true)
    expect(content.attributes('data-variant')).toBe('print')
    expect(content.attributes('data-disable-list-toggle')).toBe('true')
  })

  it('uses taskStatus when not finished and renders empty history state', () => {
    const wrapper = mount(ApprovalPrintDiffCheck, {
      props: {
        data: {
          id: 102,
          processName: '备案/签约信息审批',
          nodeName: '节点B',
          applicantName: '赵六',
          assigneeName: '钱七',
          status: 'pending',
          taskStatus: 'handling',
        } as never,
        historyList: [],
      },
    })

    const text = wrapper.text()

    expect(text).toContain('domain.approval.status.processing')
    expect(text).not.toContain('domain.approval.status.pending')
    expect(text).toContain('common.label.none')
  })
})
