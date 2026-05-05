import { WorkOrderStatus } from '@/modules/work-order/domain/enums'

type WorkOrderDetailPermissionInput = {
  detail:
    | {
        status: WorkOrderStatus
        currentHandlerId: number | null
      }
    | null
    | undefined
  isHandler: boolean
  isOwner: boolean
  isCurrentHandler: boolean
}

export type WorkOrderDetailPermissions = {
  canReplyAsHandler: boolean
  canReplyAsUser: boolean
  canReply: boolean
  canCancel: boolean
  canComplete: boolean
  canReopen: boolean
  canReject: boolean
  canClaim: boolean
  canRelease: boolean
  canScore: boolean
}

const emptyWorkOrderDetailPermissions: WorkOrderDetailPermissions = {
  canReplyAsHandler: false,
  canReplyAsUser: false,
  canReply: false,
  canCancel: false,
  canComplete: false,
  canReopen: false,
  canReject: false,
  canClaim: false,
  canRelease: false,
  canScore: false,
}

export function resolveWorkOrderDetailPermissions({
  detail,
  isHandler,
  isOwner,
  isCurrentHandler,
}: WorkOrderDetailPermissionInput): WorkOrderDetailPermissions {
  if (!detail) {
    return emptyWorkOrderDetailPermissions
  }

  const status = detail?.status

  const canReplyAsHandler = isHandler && isCurrentHandler && status === WorkOrderStatus.PROCESSING

  const canReplyAsUser =
    status !== WorkOrderStatus.COMPLETED &&
    status !== WorkOrderStatus.CANCELLED &&
    (!isHandler || isOwner)

  return {
    canReplyAsHandler,
    canReplyAsUser,
    canReply: canReplyAsHandler || canReplyAsUser,
    canCancel:
      isOwner && status !== WorkOrderStatus.CANCELLED && status !== WorkOrderStatus.COMPLETED,
    canComplete: (isOwner || isCurrentHandler) && status === WorkOrderStatus.PROCESSING,
    canReopen: isOwner && status === WorkOrderStatus.CANCELLED,
    canReject: isOwner && status === WorkOrderStatus.PROCESSING && detail?.currentHandlerId != null,
    canClaim: isHandler && status === WorkOrderStatus.PENDING,
    canRelease: isHandler && isCurrentHandler && status === WorkOrderStatus.PROCESSING,
    canScore: isOwner && status === WorkOrderStatus.COMPLETED,
  }
}

type WorkOrderReplyApiModeInput = {
  workOrderId: number
  detail: WorkOrderDetailPermissionInput['detail']
  isHandler: boolean
  isOwner: boolean
  canReplyAsHandler: boolean
}

export function resolveWorkOrderReplyApiMode({
  workOrderId,
  detail,
  isHandler,
  isOwner,
  canReplyAsHandler,
}: WorkOrderReplyApiModeInput): 'user' | 'handler' | null {
  if (!workOrderId) return null
  if (!isHandler) return 'user'
  if (!detail) return null

  if (canReplyAsHandler || !isOwner) {
    return 'handler'
  }

  return 'user'
}
