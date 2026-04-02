import { describe, expect, it, vi } from 'vitest'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `[${key}]`,
}))

import { isNotEmpty, requireRule } from '@/modules/shared/application/rules/RequireRule'

describe('isNotEmpty', () => {
  it('returns false for null and undefined', () => {
    expect(isNotEmpty(null)).toBe(false)
    expect(isNotEmpty(undefined)).toBe(false)
  })

  it('handles string empty and whitespace with options', () => {
    expect(isNotEmpty('')).toBe(false)
    expect(isNotEmpty('   ')).toBe(false)
    expect(isNotEmpty('   ', { treatWhitespaceAsEmpty: false })).toBe(true)
    expect(isNotEmpty('abc')).toBe(true)
  })

  it('handles number zero and NaN with options', () => {
    expect(isNotEmpty(0)).toBe(true)
    expect(isNotEmpty(0, { treatZeroAsEmpty: true })).toBe(false)
    expect(isNotEmpty(Number.NaN)).toBe(false)
    expect(isNotEmpty(Number.NaN, { treatNaNAsEmpty: false })).toBe(true)
  })

  it('handles array, plain object, Map, Set and Date', () => {
    expect(isNotEmpty([])).toBe(false)
    expect(isNotEmpty([], { treatEmptyArrayAsEmpty: false })).toBe(true)

    expect(isNotEmpty({})).toBe(false)
    expect(isNotEmpty({ a: 1 })).toBe(true)
    expect(isNotEmpty({}, { treatEmptyObjectAsEmpty: false })).toBe(true)

    expect(isNotEmpty(new Map())).toBe(false)
    expect(isNotEmpty(new Map([['k', 'v']]))).toBe(true)

    expect(isNotEmpty(new Set())).toBe(false)
    expect(isNotEmpty(new Set([1]))).toBe(true)

    expect(isNotEmpty(new Date('invalid-date'))).toBe(false)
    expect(isNotEmpty(new Date('2026-01-01'))).toBe(true)
  })

  it('uses customValidator when provided', () => {
    const customValidator = vi.fn((value: string) => value === 'ok')

    expect(isNotEmpty('ok', { customValidator })).toBe(true)
    expect(isNotEmpty('no', { customValidator })).toBe(false)
    expect(customValidator).toHaveBeenCalledTimes(2)
  })
})

describe('requireRule', () => {
  it('returns error with translated message when value is empty', () => {
    const result = requireRule({} as never, '姓名', '')

    expect(result).toBeInstanceOf(Error)
    expect((result as Error).message).toBe('姓名[common.validation.required]')
  })

  it('returns true for valid non-empty string', () => {
    expect(requireRule({} as never, '姓名', '张三')).toBe(true)
  })

  it('respects treatWhitespaceAsEmpty option in string validation', () => {
    const result = requireRule({} as never, '姓名', '   ', { treatWhitespaceAsEmpty: false })
    expect(result).toBe(true)
  })

  it('handles numeric/array/map/set/object branches', () => {
    expect(requireRule({} as never, '数量', 0, { treatZeroAsEmpty: true })).toBeInstanceOf(Error)
    expect(requireRule({} as never, '数量', 0)).toBe(true)

    expect(requireRule({} as never, '列表', [])).toBeInstanceOf(Error)
    expect(requireRule({} as never, '列表', [1])).toBe(true)

    expect(requireRule({} as never, '映射', new Map())).toBeInstanceOf(Error)
    expect(requireRule({} as never, '映射', new Map([['k', 'v']]))).toBe(true)

    expect(requireRule({} as never, '集合', new Set())).toBeInstanceOf(Error)
    expect(requireRule({} as never, '集合', new Set([1]))).toBe(true)

    expect(requireRule({} as never, '对象', {})).toBeInstanceOf(Error)
    expect(requireRule({} as never, '对象', { a: 1 })).toBe(true)
  })

  it('returns true for boolean false through default branch', () => {
    expect(requireRule({} as never, '标记', false)).toBe(true)
  })
})
