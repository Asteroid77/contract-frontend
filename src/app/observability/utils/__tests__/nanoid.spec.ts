import { describe, expect, it } from 'vitest'
import { nanoid } from '@/app/observability/utils/nanoid'

describe('nanoid', () => {
  it('generates id with default length 21', () => {
    const id = nanoid()

    expect(id).toHaveLength(21)
    expect(/^[A-Za-z0-9_-]+$/.test(id)).toBe(true)
  })

  it('generates id with custom length', () => {
    const id = nanoid(8)

    expect(id).toHaveLength(8)
    expect(/^[A-Za-z0-9_-]+$/.test(id)).toBe(true)
  })
})
