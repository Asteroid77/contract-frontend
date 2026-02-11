import { describe, expect, it } from 'vitest'

import { compareList } from '@/modules/approval/presentation/print/utils/ListDiff'

describe('approval/presentation/print/utils/ListDiff', () => {
  it('re-exported compareList works with null oldList (form mode)', () => {
    const rows = compareList(
      [
        { id: 1, value: 'A' },
        { id: 2, value: 'B' },
      ],
      null,
      'id',
    )

    expect(rows).toHaveLength(2)
    expect(rows[0].status).toBe('added')
    expect(rows[1].status).toBe('added')
  })

  it('re-exported compareList marks modified and removed correctly', () => {
    const rows = compareList(
      [
        { id: 1, value: 'A-new' },
        { id: 2, value: 'B' },
      ],
      [
        { id: 1, value: 'A-old' },
        { id: 3, value: 'C' },
      ],
      'id',
    )

    expect(rows).toHaveLength(3)
    expect(rows.find((row) => row.data.id === 1)?.status).toBe('modified')
    expect(rows.find((row) => row.data.id === 2)?.status).toBe('same')
    expect(rows.find((row) => row.data.id === 3)?.status).toBe('removed')
  })
})
