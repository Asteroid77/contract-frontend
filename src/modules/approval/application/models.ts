import type { BasePageRequest, BaseQuery, ConditionWrapper } from '@/modules/shared/application/request/types'
import type { QueryFilters } from '@/modules/shared/domain/query'
import type { ApprovalInstanceStatus } from '../domain/enums'
import type {
  ApprovalHistory,
  ApprovalInstance,
  ApprovalInstancePage,
  LatestAdditionalInfoInstance,
} from '../domain/types'
import type { ApprovalProcessName, ApprovalTaskStatus } from '../domain/enums'

export type { ApprovalInstanceStatus, ApprovalProcessName, ApprovalTaskStatus }
export type {
  ApprovalInstance,
  ApprovalInstancePage,
  ApprovalHistory,
  LatestAdditionalInfoInstance,
}

export interface ApprovalOpinionForm {
  taskId: number
  comment: string
  approved: boolean
}

export interface ApprovalInstancesPageQuery extends BaseQuery {
  processId?: ConditionWrapper<number>
  applicantId?: ConditionWrapper<number>
  createdTime?: ConditionWrapper<string>
  updatedTime?: ConditionWrapper<string>
  status?: ConditionWrapper<ApprovalInstanceStatus>
}

export type ApprovalInstancesPageRequest = Omit<BasePageRequest<ApprovalInstancesPageQuery>, 'query'> & {
  query?: ApprovalInstancesPageQuery | QueryFilters
}
