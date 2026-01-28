import { approvalApi } from '@/components/approval/api/approval.api'
import type {
  ApprovalOpinionRequest,
  ApprovalInstancesPageRequest,
  ApprovalInstance,
  ApprovalHistory,
  LatestAdditionalInfoInstance,
} from '@/components/approval/api/approval'
import type { BasePageRequest, IPage, ServerResponse } from '@/types/request'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import { computed, type Ref } from 'vue'
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
  INSTANCE_PAGE: (params: BasePageRequest<ApprovalInstancesPageRequest>) =>
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
    mutationFn: (taskId: number) => approvalApi.claimTask(taskId),

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
    variables: ApprovalOpinionRequest,
  ) => void
  onError?: (error: Error, variables: ApprovalOpinionRequest) => void
}) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: ApprovalOpinionRequest) => approvalApi.handleTask(request),

    onSuccess: (data, variables: ApprovalOpinionRequest) => {
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

      if (data.data.processName === '用户信息审批') {
        queryClient.invalidateQueries({
          queryKey: approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE,
        })
      }
      queryClient.invalidateQueries({
        queryKey: approvalInstanceKeys.INSTANCE_DETAIL(data.data.id),
      })

      // 执行自定义成功回调
      options?.onSuccess?.(data.data, variables)
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
    mutationFn: (instanceId: number) => approvalApi.cancelInstance(instanceId),
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
  params: BasePageRequest<ApprovalInstancesPageRequest>,
  options?: {
    enabled?: boolean
    refetchInterval?: number
  },
) => {
  return useQuery<
    ServerResponse<IPage<ApprovalInstance<Record<string, unknown>>>>,
    AxiosError<ServerResponse<unknown>>,
    IPage<ApprovalInstance<Record<string, unknown>>>
  >({
    queryKey: approvalInstanceKeys.INSTANCE_PAGE(params),
    queryFn: () => approvalApi.getInstancePage(params),
    enabled: options?.enabled ?? true,
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
    ServerResponse<ApprovalInstance<Record<string, unknown>>>,
    AxiosError<ServerResponse<unknown>>,
    ApprovalInstance<Record<string, unknown>>
  >({
    queryKey: approvalInstanceKeys.INSTANCE_DETAIL(params.value),
    queryFn: () => approvalApi.getInstanceDetail(params.value),
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
  return useQuery<
    ServerResponse<ApprovalHistory[]>,
    AxiosError<ServerResponse<unknown>>,
    ApprovalHistory[]
  >({
    queryKey: approvalKeys.HISTORY(instanceId.value),
    queryFn: () => approvalApi.getHistoryList(instanceId.value),
    enabled: computed(() => !!instanceId.value && instanceId.value > 0),
    placeholderData: (previousData) => previousData, // 保持之前的数据
  })
}

export const useLatestAdditionalInfoInstanceStatus = () => {
  return useQuery<
    ServerResponse<LatestAdditionalInfoInstance>,
    AxiosError<ServerResponse<unknown>>,
    LatestAdditionalInfoInstance
  >({
    queryKey: approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE,
    queryFn: () => approvalApi.getLatestAdditionalInfoInstanceStatus(),
  })
}
