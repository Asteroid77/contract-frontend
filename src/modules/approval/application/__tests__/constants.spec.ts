import { describe, expect, it } from 'vitest'
import { ApprovalProcessNameEnum } from '@/modules/approval/application/constants'

describe('ApprovalProcessNameEnum', () => {
  it('contains expected process name mappings', () => {
    expect(ApprovalProcessNameEnum).toEqual({
      SIGN: '备案/签约信息审批',
      USER: '用户信息审批',
    })
  })

  it('keeps key set stable for downstream usage', () => {
    expect(Object.keys(ApprovalProcessNameEnum)).toEqual(['SIGN', 'USER'])
  })
})
