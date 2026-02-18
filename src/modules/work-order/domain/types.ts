import type { WorkOrderStatus, WorkOrderUserType } from './enums'

export interface WorkOrderSummaryVO {
  id: number
  categoryId: number
  categoryName: string
  userId: number
  currentHandlerId: number | null
  title: string
  status: WorkOrderStatus
  score: number | null
  scoreDeadline: string | null
  completedAt: string | null
  createdTime: string
  updatedTime: string
}

export interface WorkOrderDetailVO extends WorkOrderSummaryVO {
  content: string
}

export interface WorkOrderReplyVO {
  id: number
  workOrderId: number
  userId: number
  userType: WorkOrderUserType
  content: string
  createdTime: string
}

export interface WorkOrderCategoryVO {
  id: number
  name: string
}

export interface WorkOrderPerformanceVO {
  handlerId: number
  completedCount: number
  scoredCount: number
  averageScore: number
}

export interface PendingCountVO {
  pendingCount: number
}

export interface CreateWorkOrderDTO {
  categoryId: number
  title: string
  content: string
}

export interface WorkOrderReplyDTO {
  content: string
}

export interface WorkOrderScoreDTO {
  score: number
}

export interface WorkOrderListParams {
  page?: number
  size?: number
  categoryId?: number
  status?: WorkOrderStatus
}
