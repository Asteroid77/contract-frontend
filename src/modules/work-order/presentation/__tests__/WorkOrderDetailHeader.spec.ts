import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import WorkOrderDetailHeader from '@/modules/work-order/presentation/WorkOrderDetailHeader'
import { WorkOrderStatus } from '@/modules/work-order/domain/enums'
import type { WorkOrderDetailVO } from '@/modules/work-order/domain/types'

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

vi.mock('@/modules/work-order/presentation/WorkOrderStatusBadge', () => ({
  default: defineComponent({
    name: 'WorkOrderStatusBadge',
    props: {
      status: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      return () => h('span', { 'data-test': 'status-badge' }, props.status)
    },
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
  NTag: defineComponent({
    name: 'NTag',
    emits: ['click'],
    setup(_, { emit, slots }) {
      return () =>
        h('button', { 'data-test': 'cancel-tag', onClick: () => emit('click') }, slots.default?.())
    },
  }),
  NPopconfirm: defineComponent({
    name: 'NPopconfirm',
    emits: ['positive-click'],
    setup(_, { emit, slots }) {
      return () =>
        h('div', { 'data-test': 'popconfirm' }, [
          slots.trigger?.(),
          h(
            'button',
            { 'data-test': 'confirm-cancel', onClick: () => emit('positive-click') },
            slots.default?.(),
          ),
        ])
    },
  }),
}))

const detail: WorkOrderDetailVO = {
  id: 11,
  categoryId: 2,
  categoryName: '电表',
  userId: 9,
  userName: 'Alice',
  currentHandlerId: 7,
  currentHandlerName: 'Bob',
  title: '工单标题',
  status: WorkOrderStatus.PROCESSING,
  score: null,
  scoreDeadline: null,
  completedAt: '2026-03-18T10:00:00+08:00',
  createdTime: '2026-03-17T10:00:00+08:00',
  updatedTime: '2026-03-17T10:00:00+08:00',
  content: '工单内容',
}

describe('WorkOrderDetailHeader', () => {
  it('renders detail summary and emits cancel from confirmation', async () => {
    const wrapper = mount(WorkOrderDetailHeader, {
      props: {
        detail,
        initiatorName: 'Alice#9',
        claimerName: 'Bob#7',
        canCancel: true,
      },
    })

    expect(wrapper.text()).toContain('工单标题')
    expect(wrapper.get('[data-test="status-badge"]').text()).toBe(WorkOrderStatus.PROCESSING)
    expect(wrapper.text()).toContain('电表')
    expect(wrapper.text()).toContain('formatted:2026-03-17T10:00:00+08:00')
    expect(wrapper.text()).toContain('domain.workOrder.label.completedAt')
    expect(wrapper.text()).toContain('formatted:2026-03-18T10:00:00+08:00')
    expect(wrapper.text()).toContain('domain.workOrder.label.initiator: Alice#9')
    expect(wrapper.text()).toContain('domain.workOrder.label.claimer: Bob#7')
    expect(wrapper.get('[data-test="cancel-tag"]').text()).toBe('domain.workOrder.action.cancel')

    await wrapper.get('[data-test="confirm-cancel"]').trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('hides optional claimer and cancel control when unavailable', () => {
    const wrapper = mount(WorkOrderDetailHeader, {
      props: {
        detail: {
          ...detail,
          completedAt: null,
        },
        initiatorName: 'Alice#9',
        claimerName: null,
        canCancel: false,
      },
    })

    expect(wrapper.text()).not.toContain('domain.workOrder.label.claimer')
    expect(wrapper.text()).not.toContain('domain.workOrder.label.completedAt')
    expect(wrapper.find('[data-test="cancel-tag"]').exists()).toBe(false)
  })
})
