import type { ApprovalProcessName } from '@/components/approval/api/approval'

export const ApprovalProcessNameEnum: {
  [key in keyof ApprovalProcessName]: ApprovalProcessName[key]
} = {
  SIGN: '备案/签约信息审批',
  USER: '用户信息审批',
}
