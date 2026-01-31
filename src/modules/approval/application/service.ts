import type { BasePageRequest, IPage } from '@/modules/shared/application/request/types'
import { toDomainPageRequest } from '@/modules/shared/application/query/legacy-query-adapter'
import { approvalRepository } from '../infrastructure/approval-repository'
import type { ApprovalOpinionForm, ApprovalInstancesPageQuery } from './models'
import type {
  ApprovalHistory,
  ApprovalInstance,
  ApprovalInstancePage,
  LatestAdditionalInfoInstance,
} from '../domain/types'
import type { ApprovalCommentRequestDTO } from '../domain/dto'

const toApprovalCommentRequest = (view: ApprovalOpinionForm): ApprovalCommentRequestDTO => ({
  taskId: view.taskId,
  comment: view.comment,
  approved: view.approved,
})

export const approvalService = {
  claimTask: (taskId: number) => approvalRepository.claimTask(taskId),
  handleTask: (request: ApprovalOpinionForm) =>
    approvalRepository.handleTask(toApprovalCommentRequest(request)) as Promise<
      ApprovalInstance<Record<string, unknown>>
    >,
  cancelInstance: (instanceId: number) => approvalRepository.cancelInstance(instanceId),
  getInstancePage: (
    pageRequest: BasePageRequest<ApprovalInstancesPageQuery>,
  ): Promise<IPage<ApprovalInstancePage>> =>
    approvalRepository.getInstancePage(toDomainPageRequest(pageRequest)),
  getInstanceDetail: (instanceId: number): Promise<ApprovalInstance<Record<string, unknown>>> =>
    approvalRepository.getInstanceDetail(instanceId),
  getHistoryList: (instanceId: number): Promise<ApprovalHistory[]> =>
    approvalRepository.getHistoryList(instanceId),
  getLatestAdditionalInfoInstanceStatus: (): Promise<LatestAdditionalInfoInstance> =>
    approvalRepository.getLatestAdditionalInfoInstanceStatus(),
}
