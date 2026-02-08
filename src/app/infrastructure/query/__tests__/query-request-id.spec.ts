import { describe, expect, it } from 'vitest'
import { clearQueryRequestId, getOrCreateQueryRequestId } from '../query-request-id'

describe('query-request-id', () => {
  it('reuses same requestId for same queryKey before clear', () => {
    const queryKey = ['approval', 'instance', 1] as const

    const first = getOrCreateQueryRequestId(queryKey)
    const second = getOrCreateQueryRequestId(queryKey)

    expect(first).toBe(second)
  })

  it('creates new requestId after clear', () => {
    const queryKey = ['approval', 'instance', 2] as const

    const first = getOrCreateQueryRequestId(queryKey)
    clearQueryRequestId(queryKey)
    const second = getOrCreateQueryRequestId(queryKey)

    expect(first).not.toBe(second)
  })

  it('uses different requestId for different queryKeys', () => {
    const keyA = ['approval', 'instance', 11] as const
    const keyB = ['approval', 'instance', 12] as const

    const idA = getOrCreateQueryRequestId(keyA)
    const idB = getOrCreateQueryRequestId(keyB)

    expect(idA).not.toBe(idB)
  })
})
