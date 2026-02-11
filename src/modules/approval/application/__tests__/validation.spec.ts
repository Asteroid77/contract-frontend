import { describe, expect, it, vi } from 'vitest'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => key,
}))

import { approvalOpinionRequestRule } from '@/modules/approval/application/validation'

describe('approvalOpinionRequestRule', () => {
  it('returns rule definitions for comment and approve fields', () => {
    const rules = approvalOpinionRequestRule()

    expect(rules.comment).toHaveLength(1)
    expect(rules.approve).toHaveLength(1)
    expect(rules.comment[0]?.required).toBe(true)
    expect(rules.approve[0]?.required).toBe(true)
    expect(rules.comment[0]?.trigger).toEqual(['blur'])
    expect(rules.approve[0]?.trigger).toEqual(['blur'])
  })

  it('comment validator rejects empty comment and accepts non-empty comment', () => {
    const rules = approvalOpinionRequestRule()
    const validator = rules.comment[0]?.validator

    expect(validator?.({} as never, '')).toBeInstanceOf(Error)
    expect(validator?.({} as never, '已审批')).toBe(true)
  })

  it('approve validator rejects undefined or null and accepts boolean values', () => {
    const rules = approvalOpinionRequestRule()
    const validator = rules.approve[0]?.validator

    expect(validator?.({} as never, undefined)).toBeInstanceOf(Error)
    expect(validator?.({} as never, null)).toBeInstanceOf(Error)
    expect(validator?.({} as never, true)).toBe(true)
    expect(validator?.({} as never, false)).toBe(true)
  })
})
