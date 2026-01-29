import type { ApprovalProcessName } from '@/modules/approval/application/models'

export const ApprovalProcessNameEnum = {
  SIGN: '备案/签约信息审批',
  USER: '用户信息审批',
} satisfies Record<'SIGN' | 'USER', ApprovalProcessName>
