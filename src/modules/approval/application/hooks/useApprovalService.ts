import { approvalService } from '@/modules/approval/application/service'
import type {
  ApprovalOpinionForm,
  ApprovalInstancesPageRequest,
  ApprovalInstance,
} from '@/modules/approval/application/models'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import { $t } from '@/_utils/i18n'

const APPROVAL_ROOT = ['approval'] as const
const APPROVAL_TASK_ROOT = [...APPROVAL_ROOT, 'tasks'] as const
const APPROVAL_INSTANCE_ROOT = [...APPROVAL_ROOT, 'instances'] as const

export const approvalKeys = {
  ALL: APPROVAL_ROOT,
  DETAIL: (id: number) => [...APPROVAL_ROOT, 'detail', id] as const,
  HISTORY: (taskId: number) => [...APPROVAL_TASK_ROOT, taskId, 'history'] as const,
  COMMENTS: (taskId: number) => [...APPROVAL_TASK_ROOT, taskId, 'comments'] as const,
}

export const approvalTaskKeys = {
  ALL: APPROVAL_TASK_ROOT,
  CLAIM: (taskId: number) => [...approvalTaskKeys.ALL, 'claim', taskId] as const,
}

export const approvalInstanceKeys = {
  ALL: APPROVAL_INSTANCE_ROOT,
  INSTANCE: APPROVAL_INSTANCE_ROOT,
  INSTANCE_PAGE: (params: ApprovalInstancesPageRequest) =>
    [...APPROVAL_INSTANCE_ROOT, 'page', params] as const,
  INSTANCE_DETAIL: (instanceId: number) =>
    [...APPROVAL_INSTANCE_ROOT, 'detail', instanceId] as const,
  LATEST_ADDITIONAL_INFO_INSTANCE: [...APPROVAL_INSTANCE_ROOT, 'latest-additional-info'] as const,
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
    meta: {
      toastOnSuccess: {
        title: $t('common.status.success'),
        content: $t('domain.approval.message.claimSuccess'),
        duration: 5000,
        keepAliveOnHover: true,
      },
    },
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
    meta: {
      toastOnSuccess: (_data, mutation) => {
        const variables = mutation.state.variables as ApprovalOpinionForm | undefined
        const contentKey =
          variables?.approved === true
            ? 'domain.approval.message.approveSuccess'
            : variables?.approved === false
              ? 'domain.approval.message.rejectSuccess'
              : 'domain.approval.message.handleSuccess'

        return {
          title: $t('common.status.success'),
          content: $t(contentKey),
          duration: 5000,
          keepAliveOnHover: true,
        }
      },
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
    meta: {
      toastOnSuccess: {
        title: $t('common.status.success'),
        content: $t('domain.approval.message.cancelSuccess'),
        duration: 5000,
        keepAliveOnHover: true,
      },
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
  return useQuery({
    queryKey: computed(() => approvalInstanceKeys.INSTANCE_PAGE(unref(params))),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () =>
        approvalService.getInstancePage(unref(params)),
      ),
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
  return useQuery({
    queryKey: computed(() => approvalInstanceKeys.INSTANCE_DETAIL(params.value)),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () =>
        approvalService.getInstanceDetail(params.value),
      ),
    enabled: computed(() => !!params.value && params.value > 0),
    placeholderData: (previousData) => previousData, // 保持之前的数据
  })
}

/**
 * 获取实例的审批记录List
 * @param instanceId 实例id
 * @returns
 */
export const useApprovalHistoryQuery = (instanceId: Ref<number>) => {
  return useQuery({
    queryKey: computed(() => approvalKeys.HISTORY(instanceId.value)),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () =>
        approvalService.getHistoryList(instanceId.value),
      ),
    enabled: computed(() => !!instanceId.value && instanceId.value > 0),
    placeholderData: (previousData) => previousData, // 保持之前的数据
  })
}

export const useLatestAdditionalInfoInstanceStatus = (options?: {
  enabled?: Ref<boolean> | boolean
  staleTime?: number
  gcTime?: number
  refetchOnWindowFocus?: boolean
  refetchOnMount?: boolean | 'always'
}) => {
  return useQuery({
    queryKey: approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE,
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () =>
        approvalService.getLatestAdditionalInfoInstanceStatus(),
      ),
    enabled: computed(() => unref(options?.enabled ?? true)),
    staleTime: options?.staleTime ?? 0,
    gcTime: options?.gcTime ?? 0,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    refetchOnMount: options?.refetchOnMount ?? 'always',
  })
}
