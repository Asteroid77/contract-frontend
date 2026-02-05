import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'
import type { BasePageRequest, IPage } from '@/modules/shared/domain/page'
import type { ApprovalCommentRequestDTO, ApprovalInstancesPageDTO } from '../domain/dto'
import type {
  ApprovalHistory,
  ApprovalInstance,
  ApprovalInstancePage,
  LatestAdditionalInfoInstance,
} from '../domain/types'

const APPROVAL_ENDPOINTS = createPrefixedEndpoints('/approval', {
  CLAIM: '/task/claim',
  HANDLE: '/task/handle',
  CANCEL: (instanceId: number) => `/instance/${instanceId}/cancel`,
})

const APPROVAL_INSTANCE_ENDPOINTS = createPrefixedEndpoints('/approval/instance', {
  PAGE: '/page',
  DETAIL: '/detail',
  LATEST_ADDITIONAL_INFO: '/additional-info/latest/status',
})

const APPROVAL_HISTORY_ENDPOINTS = createPrefixedEndpoints('/approval/history', {
  LIST: '/list',
})

export const approvalRepository = {
  claimTask: (taskId: number) =>
    useRequest<boolean, number>({
      url: APPROVAL_ENDPOINTS.CLAIM,
      method: 'post',
      data: taskId,
    }).then((resp) => resp.data),
  handleTask: (approvalCommentRequest: ApprovalCommentRequestDTO) =>
    useRequest<ApprovalInstance<Record<string, unknown>>, ApprovalCommentRequestDTO>({
      url: APPROVAL_ENDPOINTS.HANDLE,
      method: 'post',
      data: approvalCommentRequest,
    }).then((resp) => resp.data),
  cancelInstance: (instanceId: number) =>
    useRequest<boolean, number>({
      url: APPROVAL_ENDPOINTS.CANCEL(instanceId),
      method: 'post',
    }).then((resp) => resp.data),
  getInstancePage: (pageRequest: BasePageRequest<ApprovalInstancesPageDTO>) =>
    useRequest<IPage<ApprovalInstancePage>>({
      url: APPROVAL_INSTANCE_ENDPOINTS.PAGE,
      method: 'post',
      data: pageRequest,
    }).then((resp) => resp.data),
  getInstanceDetail: (instanceId: number) =>
    useRequest<ApprovalInstance<Record<string, unknown>>>({
      url: APPROVAL_INSTANCE_ENDPOINTS.DETAIL,
      method: 'get',
      params: {
        instanceId,
      },
    }).then((resp) => resp.data),
  getHistoryList: (instanceId: number) =>
    useRequest<ApprovalHistory[], { instanceId: number }>({
      url: APPROVAL_HISTORY_ENDPOINTS.LIST,
      method: 'get',
      params: {
        instanceId,
      },
    }).then((resp) => resp.data),
  getLatestAdditionalInfoInstanceStatus: () =>
    useRequest<LatestAdditionalInfoInstance>({
      url: APPROVAL_INSTANCE_ENDPOINTS.LATEST_ADDITIONAL_INFO,
      method: 'get',
    }).then((resp) => resp.data),
}
