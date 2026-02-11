import { describe, expect, it } from 'vitest'
import { BankNameMap, BankOption } from '@/modules/shared/application/constants/BankConstant'

describe('BankConstant', () => {
  it('BankOption maps all keys from BankNameMap', () => {
    const keys = Object.keys(BankNameMap)

    expect(BankOption.length).toBe(keys.length)

    for (const key of keys) {
      const option = BankOption.find((item) => item.value === key)
      expect(option).toBeTruthy()
      expect(option?.label).toBe(BankNameMap[key as keyof typeof BankNameMap].name)
    }
  })

  it('each bank config contains name and icon', () => {
    for (const [key, bank] of Object.entries(BankNameMap)) {
      expect(key.length).toBeGreaterThan(0)
      expect(bank.name.length).toBeGreaterThan(0)
      expect(bank.icon.length).toBeGreaterThan(0)
    }
  })
})
