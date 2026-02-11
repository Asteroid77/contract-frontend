import { describe, expect, it } from 'vitest'
import { invitationCodeStatus } from '@/modules/invitation/application/constants'

describe('invitation constants', () => {
  it('defines active and inactive status values', () => {
    expect(invitationCodeStatus.active).toBe(1)
    expect(invitationCodeStatus.inactive).toBe(0)
  })
})
