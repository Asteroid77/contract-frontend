import type { QueryFilters } from '@/modules/shared/domain/query'

export interface ApprovalCommentDTO {
  comment: string
  approved: boolean
}

export interface ApprovalCommentRequestDTO extends ApprovalCommentDTO {
  taskId: number
}

export type ApprovalInstancesPageDTO = QueryFilters
