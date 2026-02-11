import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('@/modules/approval/application/utils', () => ({
  showIncompletedUserName: vi.fn((name: string) => `masked:${name}`),
}))

vi.mock('@/modules/approval/presentation/approval/StatusTag', () => ({
  default: vi.fn((status: string, type: string) =>
    defineComponent({
      name: 'MockStatusTag',
      setup() {
        return () => h('span', { 'data-test': 'status-tag' }, `${status}-${type}`)
      },
    }),
  ),
}))

import TemplateNode from '@/modules/approval/presentation/approval/TemplateNode'

describe('TemplateNode', () => {
  it('uses instance status tag when approval instance is finished', () => {
    const wrapper = mount(TemplateNode, {
      props: {
        data: {
          id: 1,
          processName: '用户信息审批',
          nodeName: '节点A',
          applicantName: '张三',
          assigneeName: '李四',
          status: 'approved',
          taskStatus: 'handling',
        } as never,
      },
    })

    const text = wrapper.text()
    expect(text).toContain('用户信息审批')
    expect(text).toContain('节点A')
    expect(text).toContain('masked:张三')
    expect(text).toContain('masked:李四')
    expect(wrapper.find('[data-test="status-tag"]').text()).toBe('approved-Instance')
  })

  it('uses task status tag when approval instance is in progress', () => {
    const wrapper = mount(TemplateNode, {
      props: {
        data: {
          id: 2,
          processName: '备案/签约审批',
          nodeName: '节点B',
          applicantName: '王五',
          assigneeName: '赵六',
          status: 'pending',
          taskStatus: 'transfer',
        } as never,
      },
    })

    expect(wrapper.find('[data-test="status-tag"]').text()).toBe('transfer-Task')
  })
})
