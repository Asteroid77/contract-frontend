import type { BaseQuery, ConditionWrapper } from '@/modules/shared/application/request/types'
import type { ApprovalInstanceStatus } from '../domain/enums'
import type {
  ApprovalHistory,
  ApprovalInstance,
  ApprovalInstancePage,
  LatestAdditionalInfoInstance,
} from '../domain/types'
import type { ApprovalProcessName, ApprovalTaskStatus } from '../domain/enums'

export type { ApprovalInstanceStatus, ApprovalProcessName, ApprovalTaskStatus }
export type { ApprovalInstance, ApprovalInstancePage, ApprovalHistory, LatestAdditionalInfoInstance }

export interface ApprovalOpinionRequest {
  taskId: number
  comment: string
  approved: boolean
}

export interface ApprovalInstancesPageRequest extends BaseQuery {
  processId?: ConditionWrapper<number>
  applicantId?: ConditionWrapper<number>
  createdTime?: ConditionWrapper<string>
  updatedTime?: ConditionWrapper<string>
  status?: ConditionWrapper<ApprovalInstanceStatus>
}
