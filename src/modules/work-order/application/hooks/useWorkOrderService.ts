import { workOrderService } from '../work-order-service'
import type {
  CreateWorkOrderDTO,
  WorkOrderReplyDTO,
  WorkOrderScoreDTO,
  WorkOrderListParams,
} from '../../domain/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'

export const workOrderKeys = {
  ALL: ['work-orders'] as const,
  LIST: (params: WorkOrderListParams) => ['work-orders', 'list', params] as const,
  DETAIL: (id: number) => ['work-orders', 'detail', id] as const,
  REPLIES: (id: number) => ['work-orders', 'replies', id] as const,
  HANDLER_ALL: ['work-orders', 'handler'] as const,
  HANDLER_LIST: (params: WorkOrderListParams) =>
    ['work-orders', 'handler', 'list', params] as const,
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
  return useQuery({
    queryKey: computed(() => workOrderKeys.LIST(unref(params))),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getList(unref(params))),
    enabled: computed(() => unref(options?.enabled ?? true)),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

export const useWorkOrderDetail = (
  id: Ref<number>,
  options?: { enabled?: Ref<boolean> | boolean },
) => {
  return useQuery({
    queryKey: computed(() => workOrderKeys.DETAIL(id.value)),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getDetail(id.value)),
    enabled: computed(() => unref(options?.enabled ?? true) && !!id.value && id.value > 0),
    placeholderData: (previousData) => previousData,
  })
}

export const useWorkOrderReplies = (
  id: Ref<number>,
  options?: { enabled?: Ref<boolean> | boolean },
) => {
  return useQuery({
    queryKey: computed(() => workOrderKeys.REPLIES(id.value)),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getReplies(id.value)),
    enabled: computed(() => unref(options?.enabled ?? true) && !!id.value && id.value > 0),
    placeholderData: (previousData) => previousData,
  })
}

// ============================================================
// User-side Mutations
// ============================================================

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateWorkOrderDTO) => workOrderService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
    },
  })
}

export const useAddReply = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workOrderId, dto }: { workOrderId: number; dto: WorkOrderReplyDTO }) =>
      workOrderService.addReply(workOrderId, dto),
    onSuccess: (_, { workOrderId }) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.REPLIES(workOrderId) })
    },
  })
}

export const useCancelWorkOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => workOrderService.cancel(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useCompleteWorkOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => workOrderService.complete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useRejectHandler = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, remark }: { id: number; remark?: string }) =>
      workOrderService.rejectHandler(id, remark),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useReopenWorkOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => workOrderService.reopen(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useScoreWorkOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: WorkOrderScoreDTO }) =>
      workOrderService.score(id, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useUpdateScore = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: WorkOrderScoreDTO }) =>
      workOrderService.updateScore(id, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useRemoveBlacklist = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (handlerId: number) => workOrderService.removeBlacklist(handlerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
    },
  })
}

// ============================================================
// Handler-side Queries
// ============================================================

export const useHandlerCategories = (options?: { enabled?: Ref<boolean> | boolean }) => {
  return useQuery({
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
  return useQuery({
    queryKey: computed(() => workOrderKeys.HANDLER_LIST(unref(params))),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () =>
        workOrderService.getHandlerList(unref(params)),
      ),
    enabled: computed(() => unref(options?.enabled ?? true)),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

export const useHandlerPendingCount = (options?: { enabled?: Ref<boolean> | boolean }) => {
  return useQuery({
    queryKey: workOrderKeys.HANDLER_PENDING_COUNT,
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getHandlerPendingCount()),
    enabled: computed(() => unref(options?.enabled ?? true)),
    refetchInterval: 60 * 1000,
  })
}

export const useHandlerDetail = (
  id: Ref<number>,
  options?: { enabled?: Ref<boolean> | boolean },
) => {
  return useQuery({
    queryKey: computed(() => workOrderKeys.DETAIL(id.value)),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getHandlerDetail(id.value)),
    enabled: computed(() => unref(options?.enabled ?? true) && !!id.value && id.value > 0),
    placeholderData: (previousData) => previousData,
  })
}

export const useHandlerReplies = (
  id: Ref<number>,
  options?: { enabled?: Ref<boolean> | boolean },
) => {
  return useQuery({
    queryKey: computed(() => workOrderKeys.REPLIES(id.value)),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () =>
        workOrderService.getHandlerReplies(id.value),
      ),
    enabled: computed(() => unref(options?.enabled ?? true) && !!id.value && id.value > 0),
    placeholderData: (previousData) => previousData,
  })
}

// ============================================================
// Handler-side Mutations
// ============================================================

export const useClaimWorkOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => workOrderService.claim(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.HANDLER_ALL })
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useReleaseWorkOrder = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => workOrderService.release(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.HANDLER_ALL })
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useHandlerComplete = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => workOrderService.handlerComplete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.ALL })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.HANDLER_ALL })
      queryClient.setQueryData(workOrderKeys.DETAIL(data.id), data)
    },
  })
}

export const useHandlerAddReply = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workOrderId, dto }: { workOrderId: number; dto: WorkOrderReplyDTO }) =>
      workOrderService.addHandlerReply(workOrderId, dto),
    onSuccess: (_, { workOrderId }) => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.REPLIES(workOrderId) })
    },
  })
}

export const useHandlerPerformance = (options?: { enabled?: Ref<boolean> | boolean }) => {
  return useQuery({
    queryKey: workOrderKeys.HANDLER_PERFORMANCE,
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getPerformance()),
    enabled: computed(() => unref(options?.enabled ?? true)),
    staleTime: 60 * 1000,
  })
}
