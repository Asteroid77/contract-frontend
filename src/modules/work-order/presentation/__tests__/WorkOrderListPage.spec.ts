import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

type MockDataTableColumn = {
  key?: string
}

const { hasRoleSpy, refetchSpy } = vi.hoisted(() => ({
  hasRoleSpy: vi.fn(),
  refetchSpy: vi.fn(),
}))

const rows = [
  {
    id: 1,
    title: '工单A',
    categoryName: '宽带',
    status: 'pending',
    score: 5,
    createdTime: '2026-02-20T08:00:00+08:00',
  },
]

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@/modules/user/application/stores/useAccountStore', () => ({
  useAccountStore: () => ({
    hasRole: hasRoleSpy,
  }),
}))

vi.mock('@/modules/work-order/application/hooks/useWorkOrderService', () => ({
  useWorkOrderList: () => ({
    data: { value: { records: rows } },
    isLoading: { value: false },
    refetch: refetchSpy,
  }),
  useHandlerWorkOrderList: () => ({
    data: { value: { records: rows } },
    isLoading: { value: false },
    refetch: refetchSpy,
  }),
  useHandlerCategories: () => ({
    data: { value: [] },
  }),
}))

vi.mock('@/modules/shared/presentation/time', () => ({
  formatted: () => ({
    standard: '2026-02-20 08:00:00',
  }),
}))

vi.mock('@/modules/work-order/presentation/WorkOrderStatusBadge', () => ({
  default: defineComponent({
    name: 'WorkOrderStatusBadge',
    setup() {
      return () => h('span', { 'data-test': 'status-badge' }, 'status')
    },
  }),
}))

vi.mock('@/modules/work-order/presentation/WorkOrderCreateModal', () => ({
  default: defineComponent({
    name: 'WorkOrderCreateModal',
    setup() {
      return () => h('div', { 'data-test': 'work-order-create-modal' })
    },
  }),
}))

vi.mock('@/modules/work-order/presentation/WorkOrderCategorySelect', () => ({
  default: defineComponent({
    name: 'WorkOrderCategorySelect',
    setup() {
      return () => h('div', { 'data-test': 'work-order-category-select' })
    },
  }),
}))

vi.mock('naive-ui', () => ({
  NButton: defineComponent({
    name: 'NButton',
    emits: ['click'],
    setup(_, { emit, slots }) {
      return () =>
        h('button', { 'data-test': 'n-button', onClick: () => emit('click') }, slots.default?.())
    },
  }),
  NSpace: defineComponent({
    name: 'NSpace',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-space' }, slots.default?.())
    },
  }),
  NSelect: defineComponent({
    name: 'NSelect',
    setup() {
      return () => h('div', { 'data-test': 'n-select' })
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
    },
    setup(props) {
      return () => {
        const columns = (props.columns || []) as MockDataTableColumn[]
        const keys = columns.map((column) => String(column.key ?? ''))
        return h('div', {
          'data-test': 'n-data-table',
          'data-columns-len': String(columns.length),
          'data-column-keys': keys.join(','),
        })
      }
    },
  }),
}))

import WorkOrderListPage from '@/modules/work-order/presentation/WorkOrderListPage'

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('WorkOrderListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hasRoleSpy.mockReturnValue(false)
    setViewportWidth(1280)
  })

  it('keeps full table columns on desktop viewport', async () => {
    const wrapper = mount(WorkOrderListPage)
    await nextTick()

    const table = wrapper.get('[data-test="n-data-table"]')
    expect(table.attributes('data-columns-len')).toBe('5')
    expect(table.attributes('data-column-keys')).toBe('title,categoryName,status,score,createdTime')
  })

  it('uses compact columns on mobile viewport', async () => {
    setViewportWidth(375)
    const wrapper = mount(WorkOrderListPage)
    await nextTick()

    const table = wrapper.get('[data-test="n-data-table"]')
    expect(table.attributes('data-columns-len')).toBe('2')
    expect(table.attributes('data-column-keys')).toBe('title,status')
  })
})
