import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  approvalInstanceKeys,
  approvalKeys,
  approvalTaskKeys,
  useApprovalHistoryQuery,
  useApprovalInstanceDetail,
  useApprovalInstancePage,
  useHandleTask,
  useLatestAdditionalInfoInstanceStatus,
} from '@/modules/approval/application/hooks/useApprovalService'
import { approvalService } from '@/modules/approval/application/service'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import type {
  ApprovalInstance,
  ApprovalOpinionForm,
  LatestAdditionalInfoInstance,
} from '@/modules/approval/application/models'

vi.mock('@tanstack/vue-query', () => ({
  useMutation: vi.fn((options) => options),
  useQuery: vi.fn((options) => options),
  useQueryClient: vi.fn(),
}))

vi.mock('@/modules/approval/application/service', () => ({
  approvalService: {
    handleTask: vi.fn(),
    getHistoryList: vi.fn(),
    getInstanceDetail: vi.fn(),
    getInstancePage: vi.fn(),
    getLatestAdditionalInfoInstanceStatus: vi.fn(),
  },
}))

vi.mock('@/app/infrastructure/query/query-request-context', () => ({
  withQueryRequestContext: vi.fn((_queryKey, _ctx, runner) => runner()),
}))

const queryClient = {
  invalidateQueries: vi.fn(),
}

type HandleTaskMutationOptionsLike = {
  onSuccess?: (
    data: ApprovalInstance<Record<string, unknown>>,
    variables: ApprovalOpinionForm,
  ) => void
  onError?: (error: Error, variables: ApprovalOpinionForm) => void
}

type LatestAdditionalInfoStatusQueryOptionsLike = {
  queryKey: unknown
  enabled: {
    value: boolean
  }
  staleTime: number
  gcTime: number
  refetchOnWindowFocus: boolean
  refetchOnMount: boolean | 'always'
  queryFn: (ctx: {
    queryKey: unknown
  }) => Promise<LatestAdditionalInfoInstance> | LatestAdditionalInfoInstance
}

const getLatestMutationOptions = (): HandleTaskMutationOptionsLike => {
  const latestCall = vi.mocked(useMutation).mock.calls.at(-1)
  if (!latestCall) {
    throw new Error('useMutation should be called before reading options')
  }
  return latestCall[0] as HandleTaskMutationOptionsLike
}

const getLatestQueryOptions = (): LatestAdditionalInfoStatusQueryOptionsLike => {
  const latestCall = vi.mocked(useQuery).mock.calls.at(-1)
  if (!latestCall) {
    throw new Error('useQuery should be called before reading options')
  }
  return latestCall[0] as unknown as LatestAdditionalInfoStatusQueryOptionsLike
}

const createApprovalInstance = (processName: '用户信息审批' | '备案/签约信息审批') => ({
  id: 101,
  processId: 1,
  processName,
  formId: 9,
  currentNodeId: 2,
  nodeName: '提交',
  status: 'pending' as const,
  applicantId: 66,
  approvalData: {},
  sourceData: null,
  createdTime: '2026-02-10T10:00:00+08:00',
  taskStatus: 'pending' as const,
  taskId: 888,
})

describe('useApprovalService hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useQueryClient).mockReturnValue(queryClient as never)
    vi.mocked(approvalService.handleTask).mockResolvedValue(
      createApprovalInstance('用户信息审批') as never,
    )
    vi.mocked(approvalService.getInstancePage).mockResolvedValue({
      records: [],
      total: 0,
      size: 10,
      current: 1,
    } as never)
    vi.mocked(approvalService.getInstanceDetail).mockResolvedValue(
      createApprovalInstance('备案/签约信息审批') as never,
    )
    vi.mocked(approvalService.getHistoryList).mockResolvedValue([] as never)
    vi.mocked(approvalService.getLatestAdditionalInfoInstanceStatus).mockResolvedValue({
      id: 101,
      status: 'pending',
    } as never)
  })

  it('keeps approval task and instance keys under stable approval subtrees', () => {
    const params = {
      page: 1,
      size: 10,
      query: {},
    }

    expect(approvalTaskKeys.ALL).toEqual(['approval', 'tasks'])
    expect(approvalKeys.HISTORY(888)).toEqual(['approval', 'tasks', 888, 'history'])

    expect(approvalInstanceKeys.ALL).toEqual(['approval', 'instances'])
    expect(approvalInstanceKeys.INSTANCE_PAGE(params)).toEqual([
      'approval',
      'instances',
      'page',
      params,
    ])
    expect(approvalInstanceKeys.INSTANCE_DETAIL(101)).toEqual([
      'approval',
      'instances',
      'detail',
      101,
    ])
    expect(approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE).toEqual([
      'approval',
      'instances',
      'latest-additional-info',
    ])
  })

  it('useHandleTask invalidates common keys and additional-info key for 用户信息审批', () => {
    const onSuccess = vi.fn()

    useHandleTask({ onSuccess })
    const options = getLatestMutationOptions()

    const variables = {
      taskId: 888,
      comment: 'ok',
      approved: true,
    }
    const data = createApprovalInstance('用户信息审批')

    if (!options.onSuccess) throw new Error('onSuccess should be defined')
    options.onSuccess(data, variables)

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: approvalKeys.ALL })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: approvalTaskKeys.ALL })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: approvalInstanceKeys.ALL,
    })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE,
    })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: approvalInstanceKeys.INSTANCE_DETAIL(data.id),
    })
    expect(onSuccess).toHaveBeenCalledWith(data, variables)
  })

  it('useHandleTask skips additional-info invalidate for non-user process and calls onError', () => {
    const onError = vi.fn()

    useHandleTask({ onError })
    const options = getLatestMutationOptions()

    const data = createApprovalInstance('备案/签约信息审批')
    const variables = {
      taskId: 889,
      comment: 'reject',
      approved: false,
    }

    if (!options.onSuccess) throw new Error('onSuccess should be defined')
    options.onSuccess(data, variables)

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: approvalKeys.ALL })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: approvalTaskKeys.ALL })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: approvalInstanceKeys.ALL,
    })
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: approvalInstanceKeys.INSTANCE_DETAIL(data.id),
    })
    expect(queryClient.invalidateQueries).not.toHaveBeenCalledWith({
      queryKey: approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE,
    })

    const error = new Error('failed')
    if (!options.onError) throw new Error('onError should be defined')
    options.onError(error, variables)
    expect(onError).toHaveBeenCalledWith(error, variables)
  })

  it('useLatestAdditionalInfoInstanceStatus uses defaults and runs query fn through request context', async () => {
    useLatestAdditionalInfoInstanceStatus()
    const options = getLatestQueryOptions()

    expect(options.queryKey).toBe(approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE)
    expect(options.enabled.value).toBe(true)
    expect(options.staleTime).toBe(0)
    expect(options.gcTime).toBe(0)
    expect(options.refetchOnWindowFocus).toBe(false)
    expect(options.refetchOnMount).toBe('always')

    await options.queryFn({ queryKey: approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE })

    expect(withQueryRequestContext).toHaveBeenCalled()
    expect(approvalService.getLatestAdditionalInfoInstanceStatus).toHaveBeenCalledTimes(1)
  })

  it('useLatestAdditionalInfoInstanceStatus respects override options', () => {
    const enabled = ref(false)

    useLatestAdditionalInfoInstanceStatus({
      enabled,
      staleTime: 999,
      gcTime: 777,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    })
    const options = getLatestQueryOptions()

    expect(options.enabled.value).toBe(false)
    enabled.value = true
    expect(options.enabled.value).toBe(true)
    expect(options.staleTime).toBe(999)
    expect(options.gcTime).toBe(777)
    expect(options.refetchOnWindowFocus).toBe(true)
    expect(options.refetchOnMount).toBe(true)
  })

  it('useApprovalInstancePage keeps computed queryKey in sync with reactive params', async () => {
    const params = ref({
      page: 1,
      size: 10,
      query: {},
    })

    useApprovalInstancePage(params)
    const options = getLatestQueryOptions() as unknown as {
      queryKey: { value: unknown }
      enabled: { value: boolean }
      placeholderData: (previousData: unknown) => unknown
      queryFn: (ctx: { queryKey: unknown }) => Promise<unknown>
    }

    expect(options.queryKey.value).toEqual(approvalInstanceKeys.INSTANCE_PAGE(params.value))
    expect(options.enabled.value).toBe(true)
    expect(options.placeholderData('previous')).toBe('previous')

    await options.queryFn({ queryKey: approvalInstanceKeys.INSTANCE_PAGE(params.value) })
    expect(approvalService.getInstancePage).toHaveBeenCalledWith(params.value)

    params.value = {
      ...params.value,
      page: 2,
    }
    expect(options.queryKey.value).toEqual(approvalInstanceKeys.INSTANCE_PAGE(params.value))
  })

  it('useApprovalInstanceDetail keeps queryKey and enabled in sync with reactive id', async () => {
    const instanceId = ref(101)

    useApprovalInstanceDetail(instanceId)
    const options = getLatestQueryOptions() as unknown as {
      queryKey: { value: unknown }
      enabled: { value: boolean }
      placeholderData: (previousData: unknown) => unknown
      queryFn: (ctx: { queryKey: unknown }) => Promise<unknown>
    }

    expect(options.queryKey.value).toEqual(approvalInstanceKeys.INSTANCE_DETAIL(101))
    expect(options.enabled.value).toBe(true)
    expect(options.placeholderData('previous')).toBe('previous')

    await options.queryFn({ queryKey: approvalInstanceKeys.INSTANCE_DETAIL(101) })
    expect(approvalService.getInstanceDetail).toHaveBeenCalledWith(101)

    instanceId.value = 202
    expect(options.queryKey.value).toEqual(approvalInstanceKeys.INSTANCE_DETAIL(202))
    expect(options.enabled.value).toBe(true)

    instanceId.value = 0
    expect(options.enabled.value).toBe(false)
  })

  it('useApprovalHistoryQuery keeps queryKey in sync with reactive instance id', async () => {
    const instanceId = ref(11)

    useApprovalHistoryQuery(instanceId)
    const options = getLatestQueryOptions() as unknown as {
      queryKey: { value: unknown }
      enabled: { value: boolean }
      placeholderData: (previousData: unknown) => unknown
      queryFn: (ctx: { queryKey: unknown }) => Promise<unknown>
    }

    expect(options.queryKey.value).toEqual(approvalKeys.HISTORY(11))
    expect(options.enabled.value).toBe(true)
    expect(options.placeholderData(['previous'])).toEqual(['previous'])

    await options.queryFn({ queryKey: approvalKeys.HISTORY(11) })
    expect(approvalService.getHistoryList).toHaveBeenCalledWith(11)

    instanceId.value = 12
    expect(options.queryKey.value).toEqual(approvalKeys.HISTORY(12))

    instanceId.value = 0
    expect(options.enabled.value).toBe(false)
  })
})
