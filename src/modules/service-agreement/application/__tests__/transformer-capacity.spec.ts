import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

vi.mock('@/_utils/discrete_naive_api', () => ({
  message: {
    error: vi.fn(),
  },
}))

import { message } from '@/_utils/discrete_naive_api'
import {
  CapacityOptions,
  handleCapacityOptionCreate,
} from '@/modules/service-agreement/application/transformer-capacity'
import { TransformerCapacityOption } from '@/modules/service-agreement/application/constants'

describe('transformer capacity option helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    CapacityOptions.value = [...TransformerCapacityOption]
  })

  it('rejects invalid capacity label and clears model value', () => {
    const formModel = ref({ transformerCapacity: 100 })

    const result = handleCapacityOptionCreate('abc', formModel as any)

    expect(result).toBeUndefined()
    expect(message.error).toHaveBeenCalledTimes(1)
    expect(formModel.value.transformerCapacity).toBeUndefined()
  })

  it('reuses existing standard option instead of creating new one', () => {
    const formModel = ref({ transformerCapacity: undefined as number | undefined })

    const result = handleCapacityOptionCreate('30kva', formModel as any)

    expect(result).toBeUndefined()
    expect(formModel.value.transformerCapacity).toBe(30)
    expect(CapacityOptions.value.filter((it) => it.value === 30)).toHaveLength(1)
  })

  it('creates custom option once and reuses when called again', () => {
    const formModel = ref({ transformerCapacity: undefined as number | undefined })

    const created = handleCapacityOptionCreate('333 kVA', formModel as any)

    expect(created).toEqual({
      label: '333 kVA',
      value: 333,
    })
    expect(CapacityOptions.value.some((it) => it.value === 333)).toBe(true)

    const sizeAfterCreate = CapacityOptions.value.length

    const second = handleCapacityOptionCreate('333', formModel as any)

    expect(second).toBeUndefined()
    expect(formModel.value.transformerCapacity).toBe(333)
    expect(CapacityOptions.value.length).toBe(sizeAfterCreate)
  })

  it('ignores empty input after cleanup', () => {
    const formModel = ref({ transformerCapacity: 100 })

    const result = handleCapacityOptionCreate('   kva   ', formModel as any)

    expect(result).toBeUndefined()
    expect(message.error).not.toHaveBeenCalled()
    expect(formModel.value.transformerCapacity).toBe(100)
  })
})
