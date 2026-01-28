import type {
  ApprovalHistory,
  ApprovalInstancesPageRequest,
  LatestAdditionalInfoInstance,
} from './approval'
import { useRequest } from '@/hooks/request/useRequest'
import { createPrefixedEndpoints } from '@/_utils/api/api-prefix-generator'
import type { ApprovalOpinionRequest, ApprovalInstance } from './approval'
import type { BasePageRequest, IPage, ServerResponse } from '@/types/request'

export const APPROVAL_API_ENDPOINT = createPrefixedEndpoints('/approval', {
  CLAIM: '/task/claim',
  HANDLE: '/task/handle',
  GET_INSTANCE_PAGE: '/instance/page',
  GET_INSTANCE_DETAIL: '/instance/detail',
  GET_LATEST_ADDITIONAL_INFO_INSTANCE_STATUS: '/instance/additional-info/latest/status',
  CANCEL_APPROVAL: (instanceId) => `/instance/${instanceId}/cancel`,
})

export const APPROVAL_HISTORY_API_ENDPOINT = createPrefixedEndpoints('/approval/history', {
  LIST: '/list',
})

export const approvalApi = {
  claimTask: (taskId: number) => {
    return useRequest<ServerResponse<void>, number>({
      url: APPROVAL_API_ENDPOINT.CLAIM,
      method: 'post',
      data: taskId,
    })
  },
  handleTask: (approvalCommentRequest: ApprovalOpinionRequest) => {
    return useRequest<
      ServerResponse<ApprovalInstance<Record<string, unknown>>>,
      ApprovalOpinionRequest
    >({
      url: APPROVAL_API_ENDPOINT.HANDLE,
      method: 'post',
      data: approvalCommentRequest,
    })
  },
  cancelInstance: (instanceId: number) => {
    return useRequest<ServerResponse<boolean>, number>({
      url: APPROVAL_API_ENDPOINT.CANCEL_APPROVAL(instanceId),
      method: 'post',
    })
  },
  getInstancePage: (
    approvalInstancesPageRequest: BasePageRequest<ApprovalInstancesPageRequest>,
  ) => {
    return useRequest<ServerResponse<IPage<ApprovalInstance<Record<string, unknown>>>>>({
      url: APPROVAL_API_ENDPOINT.GET_INSTANCE_PAGE,
      method: 'post',
      data: approvalInstancesPageRequest,
    })
  },
  getInstanceDetail: (instanceId: number) => {
    return useRequest<ServerResponse<ApprovalInstance<Record<string, unknown>>>>({
      url: APPROVAL_API_ENDPOINT.GET_INSTANCE_DETAIL,
      method: 'get',
      params: {
        instanceId,
      },
    })
  },
  getHistoryList: (instanceId: number) => {
    return useRequest<ServerResponse<ApprovalHistory[]>, { instanceId: number }>({
      url: APPROVAL_HISTORY_API_ENDPOINT.LIST,
      method: 'get',
      params: {
        instanceId,
      },
    })
  },
  getLatestAdditionalInfoInstanceStatus: () => {
    return useRequest<ServerResponse<LatestAdditionalInfoInstance>, unknown>({
      url: APPROVAL_API_ENDPOINT.GET_LATEST_ADDITIONAL_INFO_INSTANCE_STATUS,
      method: 'get',
    })
  },
}
