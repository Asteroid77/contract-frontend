import { describe, expect, it, vi } from 'vitest'
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

import ApprovalHistoryDiffCheck from '@/modules/approval/presentation/approval/diff-check/ApprovalHistoryDiffCheck'

describe('ApprovalHistoryDiffCheck', () => {
  it('renders action/status mapping rows with fallback comment', () => {
    const wrapper = mount(ApprovalHistoryDiffCheck, {
      props: {
        list: [
          {
            id: 1,
            nodeName: '节点A',
            operator: '张三',
            action: 'approve',
            createdTime: '2026-02-10T10:00:00+08:00',
            comment: '',
          },
          {
            id: 2,
            nodeName: '节点B',
            operator: '李四',
            action: 'reject',
            createdTime: '2026-02-11T10:00:00+08:00',
            comment: '不同意',
          },
        ] as never,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('节点A')
    expect(text).toContain('masked:张三')
    expect(text).toContain('common.action.approve')
    expect(text).toContain('formatted:2026-02-10T10:00:00+08:00')
    expect(text).toContain('-')

    expect(text).toContain('节点B')
    expect(text).toContain('masked:李四')
    expect(text).toContain('common.action.reject')
    expect(text).toContain('不同意')
  })

  it('renders empty state row when history list is empty', () => {
    const wrapper = mount(ApprovalHistoryDiffCheck, {
      props: {
        list: [],
      },
    })

    expect(wrapper.text()).toContain('common.label.none')
  })
})
