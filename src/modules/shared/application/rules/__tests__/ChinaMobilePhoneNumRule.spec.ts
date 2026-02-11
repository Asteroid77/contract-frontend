import { describe, expect, it } from 'vitest'
import { chinaMobilePhoneVerify } from '@/modules/shared/application/rules/ChinaMobilePhoneNumRule'

describe('chinaMobilePhoneVerify', () => {
  it('returns true for valid mainland mobile numbers', () => {
    expect(chinaMobilePhoneVerify('13800138000')).toBe(true)
    expect(chinaMobilePhoneVerify('15612345678')).toBe(true)
    expect(chinaMobilePhoneVerify('16612345678')).toBe(true)
    expect(chinaMobilePhoneVerify('19912345678')).toBe(true)
  })

  it('returns false for invalid numbers', () => {
    expect(chinaMobilePhoneVerify('12345678901')).toBe(false)
    expect(chinaMobilePhoneVerify('14012345678')).toBe(false)
    expect(chinaMobilePhoneVerify('1380013800')).toBe(false)
    expect(chinaMobilePhoneVerify('138001380000')).toBe(false)
    expect(chinaMobilePhoneVerify('1380013800a')).toBe(false)
  })
})
