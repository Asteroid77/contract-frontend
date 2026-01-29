import type { ApprovalInstanceStatus, ApprovalProcessName, ApprovalTaskStatus } from './enums'

export interface ApprovalInstance<T extends object = Record<string, unknown>> {
  id: number
  processId: number
  processName: ApprovalProcessName
  formId: number
  currentNodeId: number
  nodeName: string
  status: ApprovalInstanceStatus
  applicantId: number
  approvalData: T
  sourceData: T | null
  createdTime: string
  updatedTime?: string | null
  applicantName?: string | null
  assigneeId?: number
  assigneeName?: string | null
  taskStatus: ApprovalTaskStatus
  candidateRoles?: number[] | null
  permissionValidator?: string | null
  taskId: number
}

export interface ApprovalInstancePage {
  id: number
  processId: number
  processName: ApprovalProcessName
  formId: number
  currentNodeId: number
  nodeName: string
  status: ApprovalInstanceStatus
  applicantId: number
  createdTime: string
  updatedTime?: string | null
  applicantName: string | null
  assigneeName: string | null
  taskStatus: ApprovalTaskStatus
  taskId: number
  candidateRoles?: number[] | null
  permissionValidator?: string | null
}

export interface ApprovalHistory {
  id: number
  instanceId: number
  taskId: number
  nodeId: number
  operatorId: number
  action: 'submit' | 'approve' | 'reject' | 'transfer' | 'claim' | 'cancel'
  comment: string | null
  createdTime: string
  nodeName: string
  operator: string | null
}

export interface LatestAdditionalInfoInstance {
  id: number
  status: ApprovalInstanceStatus
}
