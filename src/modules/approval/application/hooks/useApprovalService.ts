import { approvalService } from '@/modules/approval/application/service'
import type {
  ApprovalOpinionForm,
  ApprovalInstancesPageQuery,
  ApprovalInstancesPageRequest,
  ApprovalInstance,
  ApprovalInstancePage,
  ApprovalHistory,
  LatestAdditionalInfoInstance,
} from '@/modules/approval/application/models'
import type { IPage } from '@/modules/shared/application/request/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { computed, unref, type Ref } from 'vue'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
export const approvalKeys = {
  ALL: ['approval'] as const,
  DETAIL: (id: number) => ['approval', 'detail', id] as const,
  HISTORY: (taskId: number) => ['approval', 'history', taskId] as const,
  COMMENTS: (taskId: number) => ['approval', 'comments', taskId] as const,
}

export const approvalTaskKeys = {
  ALL: ['tasks'] as const,
  CLAIM: (taskId: number) => [...approvalTaskKeys.ALL, 'claim', taskId] as const,
}

export const approvalInstanceKeys = {
  ALL: ['approval', 'instance'],
  INSTANCE: ['approval', 'instance'] as const,
  INSTANCE_PAGE: (params: ApprovalInstancesPageRequest) =>
    ['approval', 'instances', 'page', params] as const,
  INSTANCE_DETAIL: (instanceId: number) => ['approval', 'instance', instanceId] as const,
  LATEST_ADDITIONAL_INFO_INSTANCE: ['approval', 'instance', 'additional_info'],
}

/**
 * 领取任务
 */
export const useClaimTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: number) => approvalService.claimTask(taskId),

    onSuccess: (_, taskId) => {
      // 使相关查询失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: approvalKeys.ALL })
      queryClient.invalidateQueries({ queryKey: approvalTaskKeys.ALL })
      queryClient.invalidateQueries({ queryKey: approvalInstanceKeys.ALL })
      queryClient.invalidateQueries({ queryKey: approvalKeys.HISTORY(taskId) })
    },
    onError: () => {},
  })
}

/**
 * 处理审批任务
 */
export const useHandleTask = (options?: {
  onSuccess?: (
    data: ApprovalInstance<Record<string, unknown>>,
    variables: ApprovalOpinionForm,
  ) => void
  onError?: (error: Error, variables: ApprovalOpinionForm) => void
}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: ApprovalOpinionForm) => approvalService.handleTask(request),

    onSuccess: (data, variables: ApprovalOpinionForm) => {
      // 使相关查询失效
      queryClient.invalidateQueries({
        queryKey: approvalKeys.ALL,
      })
      queryClient.invalidateQueries({
        queryKey: approvalTaskKeys.ALL,
      })
      queryClient.invalidateQueries({
        queryKey: approvalInstanceKeys.ALL,
      })

      if (data.processName === '用户信息审批') {
        queryClient.invalidateQueries({
          queryKey: approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE,
        })
      }
      queryClient.invalidateQueries({
        queryKey: approvalInstanceKeys.INSTANCE_DETAIL(data.id),
      })

      // 执行自定义成功回调
      options?.onSuccess?.(data, variables)
    },

    onError: (error: Error, variables) => {
      // 执行自定义错误回调
      options?.onError?.(error, variables)
    },
  })
}

export const useCancelApprovalInstance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (instanceId: number) => approvalService.cancelInstance(instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: approvalKeys.ALL,
      })
      queryClient.invalidateQueries({
        queryKey: approvalTaskKeys.ALL,
      })
      queryClient.invalidateQueries({
        queryKey: approvalInstanceKeys.ALL,
      })
    },
  })
}

/**
 * 获取审批实例分页数据
 */
export const useApprovalInstancePage = (
  params: Ref<ApprovalInstancesPageRequest> | ApprovalInstancesPageRequest,
  options?: {
    enabled?: Ref<boolean> | boolean
    refetchInterval?: number
  },
) => {
  return useQuery<IPage<ApprovalInstancePage>, AxiosError<unknown>, IPage<ApprovalInstancePage>>({
    queryKey: computed(() => approvalInstanceKeys.INSTANCE_PAGE(unref(params))),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => approvalService.getInstancePage(unref(params))),
    enabled: computed(() => unref(options?.enabled ?? true)),
    refetchInterval: options?.refetchInterval,
    staleTime: 30 * 1000, // 30秒
    placeholderData: (previousData) => previousData, // 保持之前的数据
  })
}

/**
 * 获取审批实例分页数据
 */
export const useApprovalInstanceDetail = (params: Ref<number>) => {
  return useQuery<
    ApprovalInstance<Record<string, unknown>>,
    AxiosError<unknown>,
    ApprovalInstance<Record<string, unknown>>
  >({
    queryKey: approvalInstanceKeys.INSTANCE_DETAIL(params.value),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => approvalService.getInstanceDetail(params.value)),
    enabled: !!params.value && params.value > 0,
    placeholderData: (previousData) => previousData, // 保持之前的数据
  })
}

/**
 * 获取实例的审批记录List
 * @param instanceId 实例id
 * @returns
 */
export const useApprovalHistoryQuery = (instanceId: Ref<number>) => {
  return useQuery<ApprovalHistory[], AxiosError<unknown>, ApprovalHistory[]>({
    queryKey: approvalKeys.HISTORY(instanceId.value),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => approvalService.getHistoryList(instanceId.value)),
    enabled: computed(() => !!instanceId.value && instanceId.value > 0),
    placeholderData: (previousData) => previousData, // 保持之前的数据
  })
}

export const useLatestAdditionalInfoInstanceStatus = () => {
  return useQuery<LatestAdditionalInfoInstance, AxiosError<unknown>, LatestAdditionalInfoInstance>({
    queryKey: approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE,
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () =>
        approvalService.getLatestAdditionalInfoInstanceStatus(),
      ),
  })
}
