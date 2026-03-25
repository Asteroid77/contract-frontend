import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  useAddReply,
  useCancelWorkOrder,
  useClaimWorkOrder,
  useCreateWorkOrder,
  useWorkOrderList,
  workOrderKeys,
} from '@/modules/work-order/application/hooks/useWorkOrderService'
import { workOrderService } from '@/modules/work-order/application/work-order-service'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import type {
  CreateWorkOrderDTO,
  WorkOrderDetailVO,
  WorkOrderReplyDTO,
  WorkOrderReplyVO,
  WorkOrderSummaryVO,
} from '@/modules/work-order/domain/types'

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn((options) => options),
  useMutation: vi.fn((options) => options),
  useQueryClient: vi.fn(),
}))

vi.mock('@/modules/work-order/application/work-order-service', () => ({
  workOrderService: {
    getList: vi.fn(),
    create: vi.fn(),
    cancel: vi.fn(),
    claim: vi.fn(),
    addReply: vi.fn(),
    addHandlerReply: vi.fn(),
  },
}))

vi.mock('@/app/infrastructure/query/query-request-context', () => ({
  withQueryRequestContext: vi.fn((_queryKey, _ctx, runner) => runner()),
}))

const queryClient = {
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
}

type QueryOptionsLike<TData = unknown> = {
  queryKey: { value: unknown }
  enabled?: { value: boolean }
  staleTime?: number
  placeholderData?: (previousData: unknown) => unknown
  queryFn: (ctx: { queryKey: unknown }) => Promise<TData> | TData
}

type MutationOptionsLike<TData = unknown, TVariables = unknown> = {
  mutationFn: (variables: TVariables) => Promise<TData> | TData
  onSuccess?: (data: TData, variables: TVariables) => void
}

const getLatestQueryOptions = <TData = unknown>(): QueryOptionsLike<TData> => {
  const latestCall = vi.mocked(useQuery).mock.calls.at(-1)
  if (!latestCall) {
    throw new Error('useQuery should be called before reading options')
  }
  return latestCall[0] as unknown as QueryOptionsLike<TData>
}

const getLatestMutationOptions = <TData = unknown, TVariables = unknown>(): MutationOptionsLike<
  TData,
  TVariables
> => {
  const latestCall = vi.mocked(useMutation).mock.calls.at(-1)
  if (!latestCall) {
    throw new Error('useMutation should be called before reading options')
  }
  return latestCall[0] as MutationOptionsLike<TData, TVariables>
}

const workOrderDetail: WorkOrderDetailVO = {
  id: 11,
  categoryId: 2,
  categoryName: '电表',
  userId: 9,
  userName: 'Alice',
  currentHandlerId: 3,
  currentHandlerName: 'Bob',
  title: '工单标题',
  status: 'pending' as never,
  score: null,
  scoreDeadline: null,
  completedAt: null,
  createdTime: '2026-03-17T10:00:00+08:00',
  updatedTime: '2026-03-17T10:00:00+08:00',
  content: '工单内容',
}

describe('useWorkOrderService hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useQueryClient).mockReturnValue(queryClient as never)
    vi.mocked(workOrderService.getList).mockResolvedValue({
      records: [] satisfies WorkOrderSummaryVO[],
      total: 0,
      page: 1,
      size: 10,
    } as never)
    vi.mocked(workOrderService.create).mockResolvedValue(workOrderDetail as never)
    vi.mocked(workOrderService.cancel).mockResolvedValue(workOrderDetail as never)
    vi.mocked(workOrderService.claim).mockResolvedValue(workOrderDetail as never)
    vi.mocked(workOrderService.addReply).mockResolvedValue({
      id: 1,
      workOrderId: 11,
      userId: 9,
      userName: 'Alice',
      userType: 'user' as never,
      content: '补充说明',
      createdTime: '2026-03-17T10:00:00+08:00',
    } as never)
  })

  it('defines stable work-order keys', () => {
    expect(workOrderKeys.ALL).toEqual(['work-orders'])
    expect(workOrderKeys.DETAIL(11)).toEqual(['work-orders', 'detail', 11])
    expect(workOrderKeys.REPLIES(11)).toEqual(['work-orders', 'replies', 11])
    expect(workOrderKeys.HANDLER_ALL).toEqual(['work-orders', 'handler'])
  })

  it('useWorkOrderList keeps computed key and delegates queryFn', async () => {
    const params = ref({
      page: 1,
      size: 10,
    })

    useWorkOrderList(params)
    const options = getLatestQueryOptions()

    expect(options.queryKey.value).toEqual(workOrderKeys.LIST(params.value))
    expect(options.staleTime).toBe(30 * 1000)
    expect(options.placeholderData?.('previous')).toBe('previous')
    expect((options.enabled as { value: boolean }).value).toBe(true)

    await options.queryFn({ queryKey: workOrderKeys.LIST(params.value) })

    expect(withQueryRequestContext).toHaveBeenCalledWith(
      workOrderKeys.LIST(params.value),
      { queryKey: workOrderKeys.LIST(params.value) },
      expect.any(Function),
    )
    expect(workOrderService.getList).toHaveBeenCalledWith(params.value)

    params.value = {
      ...params.value,
      page: 2,
    }
    expect(options.queryKey.value).toEqual(workOrderKeys.LIST(params.value))
  })

  it('useCreateWorkOrder invalidates list cache on success', async () => {
    useCreateWorkOrder()
    const options = getLatestMutationOptions<WorkOrderDetailVO, CreateWorkOrderDTO>()

    const payload = {
      categoryId: 2,
      title: '工单标题',
      content: '工单内容',
    }

    await options.mutationFn(payload)
    expect(workOrderService.create).toHaveBeenCalledWith(payload)

    if (!options.onSuccess) throw new Error('onSuccess should be defined')
    options.onSuccess(workOrderDetail, payload)

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: workOrderKeys.ALL,
    })
  })

  it('useAddReply invalidates replies cache and useCancelWorkOrder updates detail cache', async () => {
    useAddReply()
    const replyOptions = getLatestMutationOptions<
      WorkOrderReplyVO,
      { workOrderId: number; dto: WorkOrderReplyDTO }
    >()

    const replyPayload = {
      workOrderId: 11,
      dto: {
        content: '补充说明',
      },
    }

    await replyOptions.mutationFn(replyPayload)
    expect(workOrderService.addReply).toHaveBeenCalledWith(11, replyPayload.dto)

    if (!replyOptions.onSuccess) throw new Error('onSuccess should be defined')
    replyOptions.onSuccess(
      {
        id: 1,
        workOrderId: 11,
        userId: 9,
        userName: 'Alice',
        userType: 'user' as never,
        content: '补充说明',
        createdTime: '2026-03-17T10:00:00+08:00',
      },
      replyPayload,
    )
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: workOrderKeys.REPLIES(11),
    })

    useCancelWorkOrder()
    const cancelOptions = getLatestMutationOptions<WorkOrderDetailVO, number>()

    await cancelOptions.mutationFn(11)
    expect(workOrderService.cancel).toHaveBeenCalledWith(11)

    if (!cancelOptions.onSuccess) throw new Error('onSuccess should be defined')
    cancelOptions.onSuccess(workOrderDetail, 11)
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: workOrderKeys.ALL,
    })
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      workOrderKeys.DETAIL(workOrderDetail.id),
      workOrderDetail,
    )
  })

  it('useClaimWorkOrder invalidates user and handler caches and updates detail cache', async () => {
    useClaimWorkOrder()
    const options = getLatestMutationOptions<WorkOrderDetailVO, number>()

    await options.mutationFn(11)
    expect(workOrderService.claim).toHaveBeenCalledWith(11)

    if (!options.onSuccess) throw new Error('onSuccess should be defined')
    options.onSuccess(workOrderDetail, 11)

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: workOrderKeys.ALL,
    })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: workOrderKeys.HANDLER_ALL,
    })
    expect(queryClient.setQueryData).toHaveBeenCalledWith(
      workOrderKeys.DETAIL(workOrderDetail.id),
      workOrderDetail,
    )
  })
})
