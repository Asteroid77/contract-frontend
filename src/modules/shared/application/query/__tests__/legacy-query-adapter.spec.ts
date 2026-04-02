import { describe, expect, it } from 'vitest'
import { FilterOp } from '@/modules/shared/domain/query'
import {
  toDomainPageRequest,
  toQueryFilters,
} from '@/modules/shared/application/query/legacy-query-adapter'

describe('legacy-query-adapter', () => {
  it('returns undefined when query is missing or contains only invalid conditions', () => {
    expect(toQueryFilters(undefined)).toBeUndefined()

    expect(
      toQueryFilters({
        name: {
          condition: 'unknown' as never,
          value: '张三',
        },
      }),
    ).toBeUndefined()
  })

  it('maps legacy query to domain filters', () => {
    const filters = toQueryFilters({
      name: {
        condition: 'like',
        value: '张',
      },
      id: {
        condition: 'eq',
        value: 1,
      },
      deletedAt: {
        condition: 'isNull',
        value: null,
      },
    })

    expect(filters).toEqual({
      filters: [
        {
          field: 'name',
          op: FilterOp.LIKE,
          value: '张',
        },
        {
          field: 'id',
          op: FilterOp.EQ,
          value: 1,
        },
        {
          field: 'deletedAt',
          op: FilterOp.IS_NULL,
          value: null,
        },
      ],
    })
  })

  it('maps page request and normalizes size/orders/query', () => {
    const result = toDomainPageRequest({
      page: 2,
      size: '20' as unknown as never,
      orders: [
        {
          column: 'createdAt',
        },
        {
          column: 'name',
          direction: 'DESC',
        },
      ],
      query: {
        phone: {
          condition: 'like',
          value: '138',
        },
      },
    })

    expect(result).toEqual({
      page: 2,
      size: 20,
      orders: [
        {
          column: 'createdAt',
          direction: 'ASC',
        },
        {
          column: 'name',
          direction: 'DESC',
        },
      ],
      query: {
        filters: [
          {
            field: 'phone',
            op: FilterOp.LIKE,
            value: '138',
          },
        ],
      },
    })
  })

  it('returns undefined size when legacy size is invalid string', () => {
    const result = toDomainPageRequest({
      page: 1,
      size: 'not-a-number' as unknown as never,
      query: undefined,
      orders: undefined,
    })

    expect(result).toEqual({
      page: 1,
      size: undefined,
      orders: undefined,
      query: undefined,
    })
  })
})
