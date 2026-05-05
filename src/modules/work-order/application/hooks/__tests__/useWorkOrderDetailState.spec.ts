import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref, shallowRef } from 'vue'
import {
  useHandlerDetail,
  useHandlerReplies,
  useWorkOrderDetail,
  useWorkOrderReplies,
} from '@/modules/work-order/application/hooks/useWorkOrderService'
import { useWorkOrderDetailState } from '@/modules/work-order/application/hooks/useWorkOrderDetailState'
import { WorkOrderStatus, WorkOrderUserType } from '@/modules/work-order/domain/enums'
import type { WorkOrderDetailVO, WorkOrderReplyVO } from '@/modules/work-order/domain/types'

vi.mock('@/modules/work-order/application/hooks/useWorkOrderService', () => ({
  useWorkOrderDetail: vi.fn(),
  useHandlerDetail: vi.fn(),
  useWorkOrderReplies: vi.fn(),
  useHandlerReplies: vi.fn(),
}))

type QueryLike<TData> = {
  data: { value: TData | undefined }
  isLoading: { value: boolean }
}

type EnabledOption = {
  enabled: { value: boolean }
}

const createQuery = <TData>(data: TData | undefined): QueryLike<TData> => ({
  data: shallowRef(data),
  isLoading: ref(false),
})

const createDetail = (overrides: Partial<WorkOrderDetailVO> = {}): WorkOrderDetailVO => ({
  id: 11,
  categoryId: 2,
  categoryName: '电表',
  userId: 9,
  userName: null,
  currentHandlerId: 7,
  currentHandlerName: null,
  title: '工单标题',
  status: WorkOrderStatus.PROCESSING,
  score: null,
  scoreDeadline: null,
  completedAt: null,
  createdTime: '2026-03-17T10:00:00+08:00',
  updatedTime: '2026-03-17T10:00:00+08:00',
  content: '工单内容',
  ...overrides,
})

const createReply = (overrides: Partial<WorkOrderReplyVO> = {}): WorkOrderReplyVO => ({
  id: 1,
  workOrderId: 11,
  userId: 9,
  userName: null,
  userType: WorkOrderUserType.USER,
  content: '补充说明',
  createdTime: '2026-03-17T10:00:00+08:00',
  ...overrides,
})

const latestEnabledValue = (mockedHook: ReturnType<typeof vi.fn>) => {
  const latestCall = mockedHook.mock.calls.at(-1)
  if (!latestCall) {
    throw new Error('hook should be called before reading enabled option')
  }

  return (latestCall[1] as EnabledOption).enabled.value
}

describe('useWorkOrderDetailState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('selects user-side detail and replies for a non-handler owner', () => {
    const userDetail = createDetail({
      userId: 9,
      userName: null,
      currentHandlerId: 7,
      currentHandlerName: null,
    })
    const handlerDetail = createDetail({
      id: 12,
      title: '处理人详情不应被选中',
    })
    const userReplies = [createReply({ userId: 9, userName: null })]
    const handlerReplies = [createReply({ id: 2, userId: 7, userName: 'Handler' })]

    const userDetailQuery = createQuery(userDetail)
    const handlerDetailQuery = createQuery(handlerDetail)
    const userRepliesQuery = createQuery(userReplies)
    const handlerRepliesQuery = createQuery(handlerReplies)

    vi.mocked(useWorkOrderDetail).mockReturnValue(userDetailQuery as never)
    vi.mocked(useHandlerDetail).mockReturnValue(handlerDetailQuery as never)
    vi.mocked(useWorkOrderReplies).mockReturnValue(userRepliesQuery as never)
    vi.mocked(useHandlerReplies).mockReturnValue(handlerRepliesQuery as never)

    const workOrderId = ref(11)
    const currentUserId = ref(9)
    const state = useWorkOrderDetailState({
      workOrderId,
      isHandler: ref(false),
      currentUserId,
      currentUserDisplayName: computed(() => 'Current Alice'),
      isOwner: (ownerId) => ownerId === currentUserId.value,
    })

    expect(latestEnabledValue(vi.mocked(useWorkOrderDetail))).toBe(true)
    expect(latestEnabledValue(vi.mocked(useHandlerDetail))).toBe(false)
    expect(latestEnabledValue(vi.mocked(useWorkOrderReplies))).toBe(true)
    expect(latestEnabledValue(vi.mocked(useHandlerReplies))).toBe(false)
    expect(state.detailQuery.value).toBe(userDetailQuery)
    expect(state.detail.value).toStrictEqual(userDetail)
    expect(state.replyApiMode.value).toBe('user')
    expect(state.repliesQuery.value).toBe(userRepliesQuery)
    expect(state.replies.value).toStrictEqual(userReplies)
    expect(state.canReject.value).toBe(true)
    expect(state.canReplyAsHandler.value).toBe(false)
    expect(state.initiatorName.value).toBe('Current Alice')
    expect(state.claimerName.value).toBe('#7')
    expect(state.replyAuthorName(userReplies[0])).toBe('Current Alice')
  })

  it('selects handler-side detail and replies for a current handler', () => {
    const userDetail = createDetail({
      id: 12,
      title: '用户详情不应被选中',
    })
    const handlerDetail = createDetail({
      userId: 9,
      userName: 'Requester # 3',
      currentHandlerId: 7,
      currentHandlerName: null,
    })
    const userReplies = [createReply({ id: 2, userId: 9, userName: 'Requester' })]
    const handlerReplies = [createReply({ userId: 7, userName: null })]

    const userDetailQuery = createQuery(userDetail)
    const handlerDetailQuery = createQuery(handlerDetail)
    const userRepliesQuery = createQuery(userReplies)
    const handlerRepliesQuery = createQuery(handlerReplies)

    vi.mocked(useWorkOrderDetail).mockReturnValue(userDetailQuery as never)
    vi.mocked(useHandlerDetail).mockReturnValue(handlerDetailQuery as never)
    vi.mocked(useWorkOrderReplies).mockReturnValue(userRepliesQuery as never)
    vi.mocked(useHandlerReplies).mockReturnValue(handlerRepliesQuery as never)

    const state = useWorkOrderDetailState({
      workOrderId: ref(11),
      isHandler: ref(true),
      currentUserId: ref(7),
      currentUserDisplayName: computed(() => 'Current Handler'),
      isOwner: (ownerId) => ownerId === 7,
    })

    expect(latestEnabledValue(vi.mocked(useWorkOrderDetail))).toBe(false)
    expect(latestEnabledValue(vi.mocked(useHandlerDetail))).toBe(true)
    expect(latestEnabledValue(vi.mocked(useWorkOrderReplies))).toBe(false)
    expect(latestEnabledValue(vi.mocked(useHandlerReplies))).toBe(true)
    expect(state.detailQuery.value).toBe(handlerDetailQuery)
    expect(state.detail.value).toStrictEqual(handlerDetail)
    expect(state.replyApiMode.value).toBe('handler')
    expect(state.repliesQuery.value).toBe(handlerRepliesQuery)
    expect(state.replies.value).toStrictEqual(handlerReplies)
    expect(state.canReplyAsHandler.value).toBe(true)
    expect(state.canRelease.value).toBe(true)
    expect(state.canComplete.value).toBe(true)
    expect(state.initiatorName.value).toBe('Requester#3')
    expect(state.claimerName.value).toBe('Current Handler')
    expect(state.replyAuthorName(handlerReplies[0])).toBe('Current Handler')
  })
})
