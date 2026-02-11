import { describe, expect, it, vi } from 'vitest'
import {
  canApproveTask,
  canClaimTask,
  checkTasksClaimable,
  isApprovalFinish,
  isApproveBtnVisible,
  isCancelAccessible,
  isClaimBtnVisible,
  isShowApprovalBtn,
  showIncompletedUserName,
} from '@/modules/approval/application/utils'
import type { ApprovalInstance } from '@/modules/approval/domain/types'
import type { SignInResponse } from '@/modules/user/application/models'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => key,
}))

const createCurrentUser = (overrides: Partial<SignInResponse> = {}): SignInResponse => ({
  user: {
    id: 66,
    name: '张三',
    phone: '13800000000',
    active: '1',
    isDeleted: 0,
    platform: 'NATIVE',
  },
  profile: null,
  token: 'access-token',
  refreshToken: 'refresh-token',
  permissionList: [],
  roleList: [
    {
      id: 1,
      name: '审批员',
      description: '审批角色',
      permissions: [],
    },
  ],
  needProfile: false,
  ...overrides,
})

const createInstance = (
  overrides: Partial<ApprovalInstance<Record<string, unknown>>> = {},
): ApprovalInstance<Record<string, unknown>> => ({
  id: 101,
  processId: 1,
  processName: '用户信息审批',
  formId: 9,
  currentNodeId: 2,
  nodeName: '提交',
  status: 'pending',
  applicantId: 66,
  approvalData: {},
  sourceData: null,
  createdTime: '2026-02-10T10:00:00+08:00',
  taskStatus: 'pending',
  taskId: 888,
  candidateRoles: [1],
  ...overrides,
})

describe('approval utils', () => {
  it('canClaimTask returns false when taskId is missing', () => {
    const result = canClaimTask(createInstance({ taskId: 0 }), createCurrentUser())

    expect(result).toEqual({
      canClaim: false,
      reasonKey: 'approval.errors.taskNotExist',
      reasonParams: {
        taskId: 0,
      },
    })
  })

  it('canClaimTask blocks approved/rejected/claimed/invalid status tasks', () => {
    expect(
      canClaimTask(createInstance({ taskStatus: 'approved' }), createCurrentUser()),
    ).toMatchObject({
      canClaim: false,
      reasonKey: 'approval.errors.taskAlreadyApproved',
    })

    expect(
      canClaimTask(createInstance({ taskStatus: 'rejected' }), createCurrentUser()),
    ).toMatchObject({
      canClaim: false,
      reasonKey: 'approval.errors.taskAlreadyRejected',
    })

    expect(
      canClaimTask(
        createInstance({
          taskStatus: 'pending',
          assigneeId: 99,
        }),
        createCurrentUser(),
      ),
    ).toMatchObject({
      canClaim: false,
      reasonKey: 'approval.errors.taskAlreadyClaimed',
    })

    expect(
      canClaimTask(createInstance({ status: 'approved' }), createCurrentUser()),
    ).toEqual({
      canClaim: false,
      reasonKey: 'approval.errors.instanceStatusInvalid',
      reasonParams: {
        status: 'approved',
      },
    })

    expect(
      canClaimTask(
        createInstance({
          taskStatus: 'handling',
          status: 'pending',
        }),
        createCurrentUser(),
      ),
    ).toMatchObject({
      canClaim: false,
      reasonKey: 'approval.errors.taskAlreadyClaimed',
    })
  })

  it('canClaimTask blocks when user has no required role and passes when role matches', () => {
    const noPermission = canClaimTask(
      createInstance({ candidateRoles: [2, 3] }),
      createCurrentUser({
        roleList: [
          {
            id: 1,
            name: '普通角色',
            description: '',
            permissions: [],
          },
        ],
      }),
    )

    expect(noPermission).toEqual({
      canClaim: false,
      reasonKey: 'approval.errors.noRolePermission',
    })

    const claimable = canClaimTask(
      createInstance({ candidateRoles: [1, 2] }),
      createCurrentUser(),
    )

    expect(claimable).toEqual({ canClaim: true })
  })

  it('canApproveTask checks claim status, assignee and instance status in order', () => {
    expect(canApproveTask('pending', 66, 'pending', 66)).toEqual({
      canApprove: false,
      reasonKey: 'approval.errors.taskNotClaimed',
    })

    expect(canApproveTask('handling', 77, 'pending', 66)).toEqual({
      canApprove: false,
      reasonKey: 'approval.errors.notTaskAssignee',
    })

    expect(canApproveTask('handling', 66, 'approved', 66)).toEqual({
      canApprove: false,
      reasonKey: 'approval.errors.instanceNotPending',
    })

    expect(canApproveTask('handling', 66, 'pending', 66)).toEqual({
      canApprove: true,
    })
  })

  it('checkTasksClaimable maps each taskId to its claim result', () => {
    const result = checkTasksClaimable(
      [
        createInstance({ taskId: 1001, candidateRoles: [1] }),
        createInstance({ taskId: 1002, candidateRoles: [9] }),
      ],
      createCurrentUser(),
    )

    expect(result.get(1001)).toEqual({ canClaim: true })
    expect(result.get(1002)).toEqual({
      canClaim: false,
      reasonKey: 'approval.errors.noRolePermission',
    })
  })

  it('showIncompletedUserName handles missing/numeric/normal names', () => {
    expect(showIncompletedUserName(undefined)).toBe('common.label.none')
    expect(showIncompletedUserName(' 123 ')).toBe('domain.approval.label.incompleteUser# 123 ')
    expect(showIncompletedUserName('王五')).toBe('王五')
  })

  it('status helper functions return expected visibility and accessibility', () => {
    expect(isShowApprovalBtn('handling')).toBe(true)
    expect(isShowApprovalBtn('pending')).toBe(false)

    expect(isCancelAccessible('pending', 66, 66)).toBe(true)
    expect(isCancelAccessible('handling', 66, 99)).toBe(false)
    expect(isCancelAccessible(undefined, 66, 66)).toBe(false)

    expect(isApproveBtnVisible(undefined)).toBe(false)
    expect(isApproveBtnVisible('pending')).toBe(false)
    expect(isApproveBtnVisible('handling')).toBe(true)
    expect(isApproveBtnVisible('approved')).toBe(false)

    expect(isApprovalFinish(undefined)).toBe(false)
    expect(isApprovalFinish('pending')).toBe(false)
    expect(isApprovalFinish('approved')).toBe(true)
    expect(isApprovalFinish('handling')).toBe(false)

    expect(isClaimBtnVisible('pending', 'pending')).toBe(true)
    expect(isClaimBtnVisible('pending', 'rejected')).toBe(false)
    expect(isClaimBtnVisible('handling', 'pending')).toBe(false)
    expect(isClaimBtnVisible(undefined, 'pending')).toBe(false)
  })
})
