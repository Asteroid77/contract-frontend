import { workOrderService } from '../work-order-service'
import type {
  WorkOrderDetailVO,
  WorkOrderSummaryVO,
  WorkOrderReplyVO,
  WorkOrderCategoryVO,
  WorkOrderPerformanceVO,
  PendingCountVO,
  CreateWorkOrderDTO,
  WorkOrderReplyDTO,
  WorkOrderScoreDTO,
  WorkOrderListParams,
} from '../../domain/types'
import type { IPage } from '@/modules/shared/domain/page'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { computed, unref, type Ref } from 'vue'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'

export const workOrderKeys = {
  ALL: ['work-orders'] as const,
  LIST: (params: WorkOrderListParams) => ['work-orders', 'list', params] as const,
  DETAIL: (id: number) => ['work-orders', 'detail', id] as const,
  REPLIES: (id: number) => ['work-orders', 'replies', id] as const,
  HANDLER_ALL: ['work-orders', 'handler'] as const,
  HANDLER_LIST: (params: WorkOrderListParams) => ['work-orders', 'handler', 'list', params] as const,
  HANDLER_CATEGORIES: ['work-orders', 'handler', 'categories'] as const,
  HANDLER_PENDING_COUNT: ['work-orders', 'handler', 'pending-count'] as const,
  HANDLER_PERFORMANCE: ['work-orders', 'handler', 'performance'] as const,
}

// ============================================================
// User-side Queries
// ============================================================

export const useWorkOrderList = (
  params: Ref<WorkOrderListParams> | WorkOrderListParams,
  options?: { enabled?: Ref<boolean> | boolean },
) => {
  return useQuery<IPage<WorkOrderSummaryVO>, AxiosError<unknown>, IPage<WorkOrderSummaryVO>>({
    queryKey: computed(() => workOrderKeys.LIST(unref(params))),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getList(unref(params))),
    enabled: computed(() => unref(options?.enabled ?? true)),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

export const useWorkOrderDetail = (id: Ref<number>) => {
  return useQuery<WorkOrderDetailVO, AxiosError<unknown>, WorkOrderDetailVO>({
    queryKey: computed(() => workOrderKeys.DETAIL(id.value)),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getDetail(id.value)),
    enabled: computed(() => !!id.value && id.value > 0),
    placeholderData: (previousData) => previousData,
  })
}

export const useWorkOrderReplies = (id: Ref<number>) => {
  return useQuery<WorkOrderReplyVO[], AxiosError<unknown>, WorkOrderReplyVO[]>({
    queryKey: computed(() => workOrderKeys.REPLIES(id.value)),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getReplies(id.value)),
    enabled: computed(() => !!id.value && id.value > 0),
    placeholderData: (previousData) => previousData,
  })
}

// ============================================================
// User-side Mutations
// ============================================================

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient()
  return useMutation<WorkOrderDetailVO, AxiosError, CreateWorkOrderDTO>({
    mutationFn: (dto) => workOrderService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
    },
  })
}

export const useAddReply = () => {
  const queryClient = useQueryClient()
  return useMutation<WorkOrderReplyVO, AxiosError, { workOrderId: number; dto: WorkOrderReplyDTO }>({
    mutationFn: ({ workOrderId, dto }) => workOrderService.addReply(workOrderId, dto),
    onSuccess: (_, { workOrderId }) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.REPLIES(workOrderId) })
    },
  })
}

export const useCancelWorkOrder = () => {
  const queryClient = useQueryClient()
  return useMutation<WorkOrderDetailVO, AxiosError, number>({
    mutationFn: (id) => workOrderService.cancel(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useCompleteWorkOrder = () => {
  const queryClient = useQueryClient()
  return useMutation<WorkOrderDetailVO, AxiosError, number>({
    mutationFn: (id) => workOrderService.complete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useRejectHandler = () => {
  const queryClient = useQueryClient()
  return useMutation<WorkOrderDetailVO, AxiosError, { id: number; remark?: string }>({
    mutationFn: ({ id, remark }) => workOrderService.rejectHandler(id, remark),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useReopenWorkOrder = () => {
  const queryClient = useQueryClient()
  return useMutation<WorkOrderDetailVO, AxiosError, number>({
    mutationFn: (id) => workOrderService.reopen(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useScoreWorkOrder = () => {
  const queryClient = useQueryClient()
  return useMutation<WorkOrderDetailVO, AxiosError, { id: number; dto: WorkOrderScoreDTO }>({
    mutationFn: ({ id, dto }) => workOrderService.score(id, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useUpdateScore = () => {
  const queryClient = useQueryClient()
  return useMutation<WorkOrderDetailVO, AxiosError, { id: number; dto: WorkOrderScoreDTO }>({
    mutationFn: ({ id, dto }) => workOrderService.updateScore(id, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useRemoveBlacklist = () => {
  const queryClient = useQueryClient()
  return useMutation<boolean, AxiosError, number>({
    mutationFn: (handlerId) => workOrderService.removeBlacklist(handlerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
    },
  })
}

// ============================================================
// Handler-side Queries
// ============================================================

export const useHandlerCategories = (options?: { enabled?: Ref<boolean> | boolean }) => {
  return useQuery<WorkOrderCategoryVO[], AxiosError<unknown>, WorkOrderCategoryVO[]>({
    queryKey: workOrderKeys.HANDLER_CATEGORIES,
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getHandlerCategories()),
    enabled: computed(() => unref(options?.enabled ?? true)),
    staleTime: 5 * 60 * 1000,
  })
}

export const useHandlerWorkOrderList = (
  params: Ref<WorkOrderListParams> | WorkOrderListParams,
  options?: { enabled?: Ref<boolean> | boolean },
) => {
  return useQuery<IPage<WorkOrderSummaryVO>, AxiosError<unknown>, IPage<WorkOrderSummaryVO>>({
    queryKey: computed(() => workOrderKeys.HANDLER_LIST(unref(params))),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getHandlerList(unref(params))),
    enabled: computed(() => unref(options?.enabled ?? true)),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

export const useHandlerPendingCount = (options?: { enabled?: Ref<boolean> | boolean }) => {
  return useQuery<PendingCountVO, AxiosError<unknown>, PendingCountVO>({
    queryKey: workOrderKeys.HANDLER_PENDING_COUNT,
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getHandlerPendingCount()),
    enabled: computed(() => unref(options?.enabled ?? true)),
    refetchInterval: 60 * 1000,
  })
}

export const useHandlerDetail = (id: Ref<number>, options?: { enabled?: Ref<boolean> | boolean }) => {
  return useQuery<WorkOrderDetailVO, AxiosError<unknown>, WorkOrderDetailVO>({
    queryKey: computed(() => workOrderKeys.DETAIL(id.value)),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getHandlerDetail(id.value)),
    enabled: computed(() => unref(options?.enabled ?? true) && !!id.value && id.value > 0),
    placeholderData: (previousData) => previousData,
  })
}

export const useHandlerReplies = (id: Ref<number>, options?: { enabled?: Ref<boolean> | boolean }) => {
  return useQuery<WorkOrderReplyVO[], AxiosError<unknown>, WorkOrderReplyVO[]>({
    queryKey: computed(() => workOrderKeys.REPLIES(id.value)),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getHandlerReplies(id.value)),
    enabled: computed(() => unref(options?.enabled ?? true) && !!id.value && id.value > 0),
    placeholderData: (previousData) => previousData,
  })
}

// ============================================================
// Handler-side Mutations
// ============================================================

export const useClaimWorkOrder = () => {
  const queryClient = useQueryClient()
  return useMutation<WorkOrderDetailVO, AxiosError, number>({
    mutationFn: (id) => workOrderService.claim(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.HANDLER_ALL })
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useReleaseWorkOrder = () => {
  const queryClient = useQueryClient()
  return useMutation<WorkOrderDetailVO, AxiosError, number>({
    mutationFn: (id) => workOrderService.release(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.HANDLER_ALL })
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useHandlerComplete = () => {
  const queryClient = useQueryClient()
  return useMutation<WorkOrderDetailVO, AxiosError, number>({
    mutationFn: (id) => workOrderService.handlerComplete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.HANDLER_ALL })
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useHandlerAddReply = () => {
  const queryClient = useQueryClient()
  return useMutation<WorkOrderReplyVO, AxiosError, { workOrderId: number; dto: WorkOrderReplyDTO }>({
    mutationFn: ({ workOrderId, dto }) => workOrderService.addHandlerReply(workOrderId, dto),
    onSuccess: (_, { workOrderId }) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.REPLIES(workOrderId) })
    },
  })
}

export const useHandlerPerformance = (options?: { enabled?: Ref<boolean> | boolean }) => {
  return useQuery<WorkOrderPerformanceVO, AxiosError<unknown>, WorkOrderPerformanceVO>({
    queryKey: workOrderKeys.HANDLER_PERFORMANCE,
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getPerformance()),
    enabled: computed(() => unref(options?.enabled ?? true)),
    staleTime: 60 * 1000,
  })
}
