import { describe, expect, it, vi } from 'vitest'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
}))

import { Industries } from '@/modules/shared/application/constants/IndustriesContant'

describe('IndustriesContant', () => {
  it('contains industry options with translated labels', () => {
    expect(Industries.length).toBeGreaterThan(10)

    for (const item of Industries) {
      expect(item.value.length).toBeGreaterThan(0)
      expect(item.label.startsWith('t:common.options.industry.')).toBe(true)
    }
  })

  it('includes representative industry values', () => {
    expect(Industries.some((item) => item.value === '制造')).toBe(true)
    expect(Industries.some((item) => item.value === '金融业')).toBe(true)
    expect(Industries.some((item) => item.value === '教育')).toBe(true)
  })
})
