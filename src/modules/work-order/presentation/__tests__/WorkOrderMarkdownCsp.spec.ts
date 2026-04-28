import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

const {
  mdEditorNoEchartsSpy,
  mdPreviewNoEchartsSpy,
  routerPushSpy,
  routerBackSpy,
  createWorkOrderMutateSpy,
} = vi.hoisted(() => ({
  mdEditorNoEchartsSpy: vi.fn(),
  mdPreviewNoEchartsSpy: vi.fn(),
  routerPushSpy: vi.fn(),
  routerBackSpy: vi.fn(),
  createWorkOrderMutateSpy: vi.fn(),
}))

const workOrderDetail = {
  id: 1,
  categoryId: 10,
  categoryName: '测试分类',
  userId: 1,
  userName: '发起人',
  currentHandlerId: null,
  currentHandlerName: null,
  title: '测试工单',
  status: 'PENDING',
  score: null,
  scoreDeadline: null,
  completedAt: null,
  createdTime: '2026-04-18T10:00:00+08:00',
  updatedTime: '2026-04-18T10:00:00+08:00',
  content: '```echarts\n{"series":[]}\n```',
}

const workOrderReplies = [
  {
    id: 11,
    workOrderId: 1,
    userId: 1,
    userName: '发起人',
    userType: 'USER',
    content: '```echarts\n{"series":[]}\n```',
    createdTime: '2026-04-18T10:30:00+08:00',
  },
]

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: '1' },
  }),
  useRouter: () => ({
    push: routerPushSpy,
    back: routerBackSpy,
  }),
}))

vi.mock('@/_utils/discrete_naive_api', () => ({
  message: {
    success: vi.fn(),
  },
}))

vi.mock('@/modules/user/application/stores/useAccountStore', () => ({
  useAccountStore: () => ({
    hasRole: () => false,
    isOwner: (userId: number) => userId === 1,
    account: {
      user: { id: 1 },
    },
    user: {
      id: 1,
      name: '发起人',
    },
  }),
}))

vi.mock('@/modules/work-order/application/hooks/useWorkOrderUpload', () => ({
  useWorkOrderUpload: () => ({
    onUploadImg: vi.fn(),
  }),
}))

vi.mock('@/modules/shared/presentation/time', () => ({
  formatted: () => ({
    standard: '2026-04-18 10:30:00',
  }),
}))

vi.mock('@/modules/user/application/utils/displayName', () => ({
  resolveUserDisplayName: ({ name }: { name?: string | null }) => name ?? null,
}))

vi.mock('@/modules/work-order/application/hooks/useWorkOrderService', () => ({
  useCreateWorkOrder: () => ({
    mutate: createWorkOrderMutateSpy,
    isPending: { value: false },
  }),
  useWorkOrderDetail: () => ({
    data: { value: workOrderDetail },
    isLoading: { value: false },
  }),
  useHandlerDetail: () => ({
    data: { value: workOrderDetail },
    isLoading: { value: false },
  }),
  useWorkOrderReplies: () => ({
    data: { value: workOrderReplies },
    isLoading: { value: false },
  }),
  useHandlerReplies: () => ({
    data: { value: workOrderReplies },
    isLoading: { value: false },
  }),
  useAddReply: () => ({
    mutate: vi.fn(),
    isPending: { value: false },
  }),
  useHandlerAddReply: () => ({
    mutate: vi.fn(),
    isPending: { value: false },
  }),
  useCancelWorkOrder: () => ({
    mutate: vi.fn(),
    isPending: { value: false },
  }),
  useCompleteWorkOrder: () => ({
    mutate: vi.fn(),
    isPending: { value: false },
  }),
  useRejectHandler: () => ({
    mutate: vi.fn(),
    isPending: { value: false },
  }),
  useReopenWorkOrder: () => ({
    mutate: vi.fn(),
    isPending: { value: false },
  }),
  useClaimWorkOrder: () => ({
    mutate: vi.fn(),
    isPending: { value: false },
  }),
  useReleaseWorkOrder: () => ({
    mutate: vi.fn(),
    isPending: { value: false },
  }),
  useHandlerComplete: () => ({
    mutate: vi.fn(),
    isPending: { value: false },
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

vi.mock('@/modules/work-order/presentation/WorkOrderStatusBadge', () => ({
  default: defineComponent({
    name: 'WorkOrderStatusBadge',
    setup() {
      return () => h('div', { 'data-test': 'work-order-status-badge' })
    },
  }),
}))

vi.mock('@/modules/work-order/presentation/WorkOrderScoreSection.vue', () => ({
  default: defineComponent({
    name: 'WorkOrderScoreSection',
    setup() {
      return () => h('div', { 'data-test': 'work-order-score-section' })
    },
  }),
}))

vi.mock('@/modules/work-order/presentation/md-editor-loader', () => ({
  loadMdEditor: async () =>
    defineComponent({
      name: 'MockMdEditor',
      setup(_, { attrs }) {
        mdEditorNoEchartsSpy(attrs.noEcharts)

        return () =>
          h('div', {
            'data-test': 'mock-md-editor',
            'data-no-echarts': String(attrs.noEcharts),
          })
      },
    }),
  loadMdPreview: async () =>
    defineComponent({
      name: 'MockMdPreview',
      setup(_, { attrs }) {
        mdPreviewNoEchartsSpy(attrs.noEcharts)

        return () =>
          h('div', {
            'data-test': 'mock-md-preview',
            'data-no-echarts': String(attrs.noEcharts),
          })
      },
    }),
}))

vi.mock('naive-ui', () => {
  const slotOnly = (name: string, tag = 'div') =>
    defineComponent({
      name,
      setup(_, { slots }) {
        return () => h(tag, { 'data-test': name }, slots.default?.())
      },
    })

  return {
    NModal: defineComponent({
      name: 'NModal',
      props: {
        show: {
          type: Boolean,
          default: false,
        },
      },
      setup(props, { slots }) {
        return () => (props.show ? h('div', { 'data-test': 'NModal' }, slots.default?.()) : null)
      },
    }),
    NCard: slotOnly('NCard'),
    NForm: slotOnly('NForm', 'form'),
    NFormItem: slotOnly('NFormItem'),
    NButton: slotOnly('NButton', 'button'),
    NSpace: slotOnly('NSpace'),
    NSpin: slotOnly('NSpin'),
    NDivider: slotOnly('NDivider', 'hr'),
    NText: slotOnly('NText', 'span'),
    NTag: slotOnly('NTag', 'span'),
    NResult: slotOnly('NResult'),
    NPopconfirm: defineComponent({
      name: 'NPopconfirm',
      setup(_, { slots }) {
        return () =>
          h('div', { 'data-test': 'NPopconfirm' }, [slots.trigger?.(), slots.default?.()])
      },
    }),
    NInput: defineComponent({
      name: 'NInput',
      setup(_, { slots }) {
        return () => h('div', { 'data-test': 'NInput' }, slots.default?.())
      },
    }),
  }
})

import WorkOrderCreateModal from '@/modules/work-order/presentation/WorkOrderCreateModal.vue'
import WorkOrderDetailPage from '@/modules/work-order/presentation/WorkOrderDetailPage.vue'

describe('work-order markdown CSP wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses the preloaded markdown editor from the loader in the create modal', async () => {
    const wrapper = mount(WorkOrderCreateModal, {
      props: {
        show: true,
      },
    })

    await flushPromises()

    expect(wrapper.get('[data-test="mock-md-editor"]')).toBeTruthy()
    expect(mdEditorNoEchartsSpy).toHaveBeenCalledWith(undefined)
  })

  it('uses the preloaded markdown preview and editor from the loader in work-order detail', async () => {
    const wrapper = mount(WorkOrderDetailPage, {
      global: {
        mocks: {
          $router: {
            back: routerBackSpy,
          },
        },
      },
    })

    await flushPromises()

    const previews = wrapper.findAll('[data-test="mock-md-preview"]')
    expect(previews).toHaveLength(2)
    expect(wrapper.get('[data-test="mock-md-editor"]')).toBeTruthy()
    expect(mdPreviewNoEchartsSpy).toHaveBeenCalledWith(undefined)
    expect(mdEditorNoEchartsSpy).toHaveBeenCalledWith(undefined)
  })
})
