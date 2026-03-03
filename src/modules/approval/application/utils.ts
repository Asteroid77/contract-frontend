import { $t } from '@/_utils/i18n'
import type {
  ApprovalInstance,
  ApprovalInstanceStatus,
  ApprovalTaskStatus,
} from '@/modules/approval/application/models'
import type { SignInResponseComplete } from '@/modules/user/application/models'
import { resolveUserDisplayText } from '@/modules/user/application/utils/displayName'

export type ClaimTaskError = {
  canClaim: boolean
  reasonKey?: string
  reasonParams?: Record<string, unknown>
}
/**
 * 判断当前用户是否可以领取审批任务
 * @param {ApprovalInstance<Record<string, unknown>>} instance - 审批实例
 * @param {SignInResponse} currentUser - 当前用户信息
 * @returns {ClaimTaskError} 验证结果
 */
export function canClaimTask(
  instance: ApprovalInstance<Record<string, unknown>>,
  currentUser: SignInResponseComplete,
): ClaimTaskError {
  // 1. 检查任务是否存在
  if (!instance.taskId) {
    return {
      canClaim: false,
      reasonKey: 'approval.errors.taskNotExist',
      reasonParams: { taskId: instance.taskId },
    }
  }

  // 2. 检查任务状态
  const taskStatus = instance.taskStatus

  if (taskStatus === 'approved') {
    return {
      canClaim: false,
      reasonKey: 'approval.errors.taskAlreadyApproved',
    }
  }

  if (taskStatus === 'rejected') {
    return {
      canClaim: false,
      reasonKey: 'approval.errors.taskAlreadyRejected',
    }
  }

  if (
    taskStatus === 'pending' &&
    instance.assigneeId &&
    instance.assigneeId !== currentUser.user.id
  ) {
    return {
      canClaim: false,
      reasonKey: 'approval.errors.taskAlreadyClaimed',
    }
  }

  const instanceStatus = instance.status?.toLowerCase()
  if (instanceStatus !== 'pending') {
    return {
      canClaim: false,
      reasonKey: 'approval.errors.instanceStatusInvalid',
      reasonParams: { status: instanceStatus },
    }
  }

  if (taskStatus === 'handling') {
    return {
      canClaim: false,
      reasonKey: 'approval.errors.taskAlreadyClaimed',
    }
  }

  // 3. 检查角色权限
  const userRoleIds = currentUser.roleList?.map((role: { id: number }) => role.id) || []
  const requiredRoleIds = instance.candidateRoles || []

  const hasRequiredRole =
    requiredRoleIds.length === 0 ||
    requiredRoleIds.some((roleId: number) => userRoleIds.includes(roleId))

  if (!hasRequiredRole) {
    return {
      canClaim: false,
      reasonKey: 'approval.errors.noRolePermission',
    }
  }

  // 所有检查通过
  return {
    canClaim: true,
  }
}

/**
 * 判断用户是否可以审批任务（已领取的任务）
 */
export function canApproveTask(
  taskStatus: ApprovalTaskStatus,
  assigneeId: number,
  instanceStatus: ApprovalInstanceStatus,
  currentUserId: number,
) {
  // 必须是已领取状态
  if (taskStatus !== 'handling') {
    return {
      canApprove: false,
      reasonKey: 'approval.errors.taskNotClaimed',
    }
  }

  // 必须是领取人本人
  if (assigneeId !== currentUserId) {
    return {
      canApprove: false,
      reasonKey: 'approval.errors.notTaskAssignee',
    }
  }

  // 实例必须是待处理状态
  if (instanceStatus !== 'pending') {
    return {
      canApprove: false,
      reasonKey: 'approval.errors.instanceNotPending',
    }
  }

  return {
    canApprove: true,
  }
}

/**
 * 批量检查任务是否可领取
 */
export function checkTasksClaimable(
  instances: ApprovalInstance<Record<string, unknown>>[],
  currentUser: SignInResponseComplete,
) {
  const result = new Map()

  instances.forEach((item) => {
    const validation = canClaimTask(item, currentUser)
    result.set(item.taskId, validation)
  })

  return result
}

/**
 * 展示name
 * @param name 用户名
 * @returns string 完整用户名
 */
export function showIncompletedUserName(name: string | null | undefined): string {
  return resolveUserDisplayText(name, {
    emptyFallback: $t('common.label.none'),
    numericNamePrefix: $t('domain.approval.label.incompleteUser'),
  })
}

export function isShowApprovalBtn(status: ApprovalTaskStatus | undefined) {
  return status === 'handling'
}

export { BusinessError } from '@/modules/shared/domain/errors'

export function isCancelAccessible(
  status: ApprovalInstanceStatus | undefined,
  applicantId: number | undefined,
  userId: number | undefined,
) {
  if (!status) return false
  return ['handling', 'pending'].includes(status) && applicantId === userId
}

export function isApproveBtnVisible(status: ApprovalInstanceStatus | undefined | null) {
  if (!status || status === 'pending') return false
  return !['rejected', 'canceled', 'approved'].includes(status)
}
export function isApprovalFinish(status: ApprovalInstanceStatus | undefined | null) {
  if (!status || status === 'pending') return false
  return ['rejected', 'canceled', 'approved'].includes(status)
}
export function isClaimBtnVisible(
  taskStatus: ApprovalTaskStatus | undefined,
  status: ApprovalInstanceStatus | undefined,
) {
  if (!status || !taskStatus) return false
  return !['rejected', 'canceled', 'approved'].includes(status) && taskStatus === 'pending'
}
