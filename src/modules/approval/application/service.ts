import type { BasePageRequest, IPage } from '@/modules/shared/application/request/types'
import { toDomainPageRequest } from '@/modules/shared/application/query/legacy-query-adapter'
import { approvalRepository } from '../infrastructure/approval-repository'
import type { ApprovalOpinionForm, ApprovalInstancesPageQuery, ApprovalInstancesPageRequest } from './models'
import type {
  ApprovalHistory,
  ApprovalInstance,
  ApprovalInstancePage,
  LatestAdditionalInfoInstance,
} from '../domain/types'
import type { ApprovalCommentRequestDTO } from '../domain/dto'
import type { QueryFilters } from '@/modules/shared/domain/query'
import type { BasePageRequest as DomainBasePageRequest } from '@/modules/shared/domain/page'

const toApprovalCommentRequest = (view: ApprovalOpinionForm): ApprovalCommentRequestDTO => ({
  taskId: view.taskId,
  comment: view.comment,
  approved: view.approved,
})

const isQueryFilters = (query: unknown): query is QueryFilters => {
  if (!query || typeof query !== 'object') return false
  return 'filters' in query || 'group' in query
}

const normalizeSize = (size?: ApprovalInstancesPageRequest['size']) => {
  if (size == null) return undefined
  if (typeof size === 'number') return size
  if (typeof size === 'string') {
    const parsed = Number(size)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

const toDomainPageRequestSmart = (
  pageRequest: ApprovalInstancesPageRequest,
): DomainBasePageRequest<QueryFilters> => {
  if (isQueryFilters(pageRequest.query)) {
    return {
      page: pageRequest.page,
      size: normalizeSize(pageRequest.size),
      orders: pageRequest.orders?.map((item) => ({
        column: item.column,
        direction: item.direction ?? 'ASC',
      })),
      query: pageRequest.query,
    }
  }
  return toDomainPageRequest(pageRequest as BasePageRequest<ApprovalInstancesPageQuery>)
}

export const approvalService = {
  claimTask: (taskId: number) => approvalRepository.claimTask(taskId),
  handleTask: (request: ApprovalOpinionForm) =>
    approvalRepository.handleTask(toApprovalCommentRequest(request)) as Promise<
      ApprovalInstance<Record<string, unknown>>
    >,
  cancelInstance: (instanceId: number) => approvalRepository.cancelInstance(instanceId),
  getInstancePage: (
    pageRequest: ApprovalInstancesPageRequest,
  ): Promise<IPage<ApprovalInstancePage>> =>
    approvalRepository.getInstancePage(toDomainPageRequestSmart(pageRequest)),
  getInstanceDetail: (instanceId: number): Promise<ApprovalInstance<Record<string, unknown>>> =>
    approvalRepository.getInstanceDetail(instanceId),
  getHistoryList: (instanceId: number): Promise<ApprovalHistory[]> =>
    approvalRepository.getHistoryList(instanceId),
  getLatestAdditionalInfoInstanceStatus: (): Promise<LatestAdditionalInfoInstance> =>
    approvalRepository.getLatestAdditionalInfoInstanceStatus(),
}
