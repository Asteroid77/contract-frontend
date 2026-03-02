import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const { historyRef } = vi.hoisted(() => ({
  historyRef: { value: [] as Array<Record<string, unknown>> },
}))

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('@/modules/user/application/utils/displayName', () => ({
  resolveUserDisplayText: vi.fn((name: string) => `masked:${name}`),
}))

vi.mock('@/modules/shared/presentation/time', () => ({
  formatted: vi.fn((value: string) => ({
    standard: `formatted:${value}`,
  })),
}))

vi.mock('@/modules/approval/application/hooks/useApprovalService', () => ({
  useApprovalHistoryQuery: vi.fn(() => ({
    data: historyRef,
  })),
}))

import TemplateRecord from '@/modules/approval/presentation/approval/TemplateRecord'

describe('TemplateRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    historyRef.value = []
  })

  it('maps first cancel node to withdraw and last node to submit', () => {
    historyRef.value = [
      {
        id: 1,
        instanceId: 10,
        taskId: 11,
        nodeId: 12,
        nodeName: '原节点1',
        operator: '张三',
        operatorId: 1,
        action: 'cancel',
        createdTime: '2026-02-10T10:00:00+08:00',
        comment: '',
      },
      {
        id: 2,
        instanceId: 10,
        taskId: 13,
        nodeId: 14,
        nodeName: '原节点2',
        operator: '李四',
        operatorId: 2,
        action: 'approve',
        createdTime: '2026-02-11T10:00:00+08:00',
        comment: '同意',
      },
    ]

    const wrapper = mount(TemplateRecord, {
      props: {
        data: {
          id: 10,
          status: 'approved',
          taskStatus: 'approved',
        } as never,
      },
    })

    const text = wrapper.text()

    expect(text).toContain('domain.approval.history.withdraw')
    expect(text).toContain('domain.approval.history.submit')
    expect(text).toContain('masked:张三')
    expect(text).toContain('masked:李四')
    expect(text).toContain('common.action.cancel')
    expect(text).toContain('common.action.approve')
    expect(text).toContain('formatted:2026-02-10T10:00:00+08:00')
    expect(text).toContain('同意')
    expect(text).toContain('-')
  })

  it('renders empty state when history query has no rows', () => {
    historyRef.value = []

    const wrapper = mount(TemplateRecord, {
      props: {
        data: {
          id: 20,
          status: 'pending',
          taskStatus: 'handling',
        } as never,
      },
    })

    expect(wrapper.text()).toContain('common.label.none')
  })
})
