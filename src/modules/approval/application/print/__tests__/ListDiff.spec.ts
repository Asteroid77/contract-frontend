import { describe, expect, it } from 'vitest'
import { compareList } from '@/modules/approval/application/print/ListDiff'

type Item = {
  id: number
  name: string
  value: number
}

describe('compareList', () => {
  it('marks unmatched new items as added when oldList is null', () => {
    const result = compareList<Item>(
      [
        { id: 1, name: 'A', value: 10 },
        { id: 2, name: 'B', value: 20 },
      ],
      null,
      'id',
    )

    expect(result).toEqual([
      {
        data: { id: 1, name: 'A', value: 10 },
        status: 'added',
      },
      {
        data: { id: 2, name: 'B', value: 20 },
        status: 'added',
      },
    ])
  })

  it('marks unmatched new items as same when oldList is undefined', () => {
    const result = compareList<Item>([{ id: 1, name: 'A', value: 10 }], undefined, 'id')

    expect(result).toEqual([
      {
        data: { id: 1, name: 'A', value: 10 },
        status: 'same',
      },
    ])
  })

  it('marks same and modified rows by key matching and deep comparison', () => {
    const result = compareList<Item>(
      [
        { id: 1, name: 'A', value: 10 },
        { id: 2, name: 'B2', value: 30 },
      ],
      [
        { id: 1, name: 'A', value: 10 },
        { id: 2, name: 'B', value: 20 },
      ],
      'id',
    )

    expect(result).toEqual([
      {
        data: { id: 1, name: 'A', value: 10 },
        status: 'same',
      },
      {
        data: { id: 2, name: 'B2', value: 30 },
        oldData: { id: 2, name: 'B', value: 20 },
        status: 'modified',
      },
    ])
  })

  it('appends removed rows when old list has extra keys', () => {
    const result = compareList<Item>(
      [{ id: 1, name: 'A', value: 10 }],
      [
        { id: 1, name: 'A', value: 10 },
        { id: 3, name: 'C', value: 30 },
      ],
      'id',
    )

    expect(result).toEqual([
      {
        data: { id: 1, name: 'A', value: 10 },
        status: 'same',
      },
      {
        data: { id: 3, name: 'C', value: 30 },
        oldData: { id: 3, name: 'C', value: 30 },
        status: 'removed',
      },
    ])
  })

  it('ignores old items with falsy key values in old map build', () => {
    const result = compareList<Item>(
      [{ id: 0, name: 'Zero-New', value: 1 }],
      [{ id: 0, name: 'Zero-Old', value: 2 }],
      'id',
    )

    expect(result).toEqual([
      {
        data: { id: 0, name: 'Zero-New', value: 1 },
        status: 'same',
      },
    ])
  })
})
