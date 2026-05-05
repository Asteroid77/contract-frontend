import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import WorkOrderReplyList from '@/modules/work-order/presentation/WorkOrderReplyList'
import { WorkOrderUserType } from '@/modules/work-order/domain/enums'
import type { WorkOrderReplyVO } from '@/modules/work-order/domain/types'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/modules/shared/presentation/time', () => ({
  formatted: (value: string) => ({
    standard: `formatted:${value}`,
  }),
}))

vi.mock('naive-ui', () => ({
  NSpace: defineComponent({
    name: 'NSpace',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-space' }, slots.default?.())
    },
  }),
  NText: defineComponent({
    name: 'NText',
    setup(_, { slots }) {
      return () => h('span', { 'data-test': 'n-text' }, slots.default?.())
    },
  }),
  NCard: defineComponent({
    name: 'NCard',
    props: {
      style: {
        type: Object,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'section',
          {
            'data-test': 'reply-card',
            'data-border-left': String(props.style?.borderLeft ?? ''),
          },
          [h('header', { 'data-test': 'reply-header' }, slots.header?.()), slots.default?.()],
        )
    },
  }),
}))

const replies: WorkOrderReplyVO[] = [
  {
    id: 1,
    workOrderId: 11,
    userId: 9,
    userName: 'Alice',
    userType: WorkOrderUserType.USER,
    content: '用户回复',
    createdTime: '2026-03-17T10:00:00+08:00',
  },
  {
    id: 2,
    workOrderId: 11,
    userId: 7,
    userName: 'Bob',
    userType: WorkOrderUserType.HANDLER,
    content: '处理人回复',
    createdTime: '2026-03-17T11:00:00+08:00',
  },
]

describe('WorkOrderReplyList', () => {
  it('renders reply count and empty state', () => {
    const wrapper = mount(WorkOrderReplyList, {
      props: {
        replies: [],
        replyAuthorName: () => '',
        renderMarkdownPreview: () => h('div'),
      },
    })

    expect(wrapper.text()).toContain('domain.workOrder.action.reply (0)')
    expect(wrapper.text()).toContain('domain.workOrder.message.noReplies')
    expect(wrapper.find('[data-test="reply-card"]').exists()).toBe(false)
  })

  it('renders replies with author metadata and markdown preview', () => {
    const wrapper = mount(WorkOrderReplyList, {
      props: {
        replies,
        replyAuthorName: (reply: WorkOrderReplyVO) => `author:${reply.userId}`,
        renderMarkdownPreview: (content: string) =>
          h('article', { 'data-test': 'markdown-preview' }, content),
      },
    })

    expect(wrapper.text()).toContain('domain.workOrder.action.reply (2)')

    const cards = wrapper.findAll('[data-test="reply-card"]')
    expect(cards).toHaveLength(2)
    expect(cards[0].attributes('data-border-left')).toBe('0.25rem solid var(--n-border-color)')
    expect(cards[1].attributes('data-border-left')).toBe('0.25rem solid var(--n-color-target)')

    expect(cards[0].text()).toContain('author:9')
    expect(cards[0].text()).toContain('domain.workOrder.label.userReply')
    expect(cards[0].text()).toContain('formatted:2026-03-17T10:00:00+08:00')
    expect(cards[0].get('[data-test="markdown-preview"]').text()).toBe('用户回复')

    expect(cards[1].text()).toContain('author:7')
    expect(cards[1].text()).toContain('domain.workOrder.label.handlerReply')
    expect(cards[1].text()).toContain('formatted:2026-03-17T11:00:00+08:00')
    expect(cards[1].get('[data-test="markdown-preview"]').text()).toBe('处理人回复')
  })
})
