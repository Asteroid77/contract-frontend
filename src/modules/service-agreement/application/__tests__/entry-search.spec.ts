import { describe, expect, it } from 'vitest'
import { FilterOp, QueryLogic } from '@/modules/shared/domain/query'
import {
  buildServiceAgreementPageRouteQuery,
  buildServiceAgreementPrefillQuery,
  buildServiceAgreementPrefillQueryFromPageQuery,
  canCreateServiceAgreementFromQuery,
  extractServiceAgreementPrefill,
  normalizeServiceAgreementPageQuery,
  parseServiceAgreementPageRouteQuery,
  parseServiceAgreementPrefillQuery,
} from '@/modules/service-agreement/application/entry-search'

describe('service-agreement entry search', () => {
  it('normalizes page query by trimming string values and dropping empty filters', () => {
    expect(
      normalizeServiceAgreementPageQuery({
        filters: [
          { field: 'companyName', op: FilterOp.LIKE_RIGHT, value: '  测试公司  ' },
          { field: 'companyArea', op: FilterOp.EQ, value: '   ' },
          { field: 'status', op: FilterOp.EQ, value: 2 },
        ],
      }),
    ).toEqual({
      filters: [
        { field: 'companyName', op: FilterOp.LIKE_RIGHT, value: '测试公司' },
        { field: 'status', op: FilterOp.EQ, value: 2 },
      ],
    })
  })

  it('serializes and parses full advanced query state through route query', () => {
    const query = {
      filters: [
        { field: 'companyName', op: FilterOp.LIKE_RIGHT, value: '测试公司' },
        { field: 'companyArea', op: FilterOp.EQ, value: '330100' },
      ],
      group: {
        logic: QueryLogic.AND,
        filters: [],
        groups: [
          {
            logic: QueryLogic.OR,
            filters: [{ field: 'status', op: FilterOp.EQ, value: 2 }],
            groups: [],
          },
        ],
      },
    }

    const routeQuery = buildServiceAgreementPageRouteQuery(query)
    const normalizedQuery = {
      filters: [
        { field: 'companyName', op: FilterOp.LIKE_RIGHT, value: '测试公司' },
        { field: 'companyArea', op: FilterOp.EQ, value: '330100' },
      ],
      group: {
        logic: QueryLogic.AND,
        groups: [
          {
            logic: QueryLogic.OR,
            filters: [{ field: 'status', op: FilterOp.EQ, value: 2 }],
          },
        ],
      },
    }
    expect(routeQuery).toEqual({
      q: JSON.stringify(normalizedQuery),
    })

    expect(parseServiceAgreementPageRouteQuery(routeQuery)).toEqual(normalizedQuery)
    expect(parseServiceAgreementPageRouteQuery({})).toBeNull()
  })

  it('extracts duplicate-check prefill from query and judges whether create is allowed', () => {
    const query = {
      filters: [
        { field: 'companyName', op: FilterOp.LIKE_RIGHT, value: '测试公司' },
        { field: 'companyArea', op: FilterOp.EQ, value: '330100' },
        { field: 'status', op: FilterOp.EQ, value: 2 },
      ],
    }

    expect(extractServiceAgreementPrefill(query)).toEqual({
      companyName: '测试公司',
      companyArea: '330100',
      status: 2,
    })
    expect(canCreateServiceAgreementFromQuery(query)).toBe(true)
    expect(
      canCreateServiceAgreementFromQuery({
        filters: [{ field: 'status', op: FilterOp.EQ, value: 2 }],
      }),
    ).toBe(false)
  })

  it('serializes and parses whitelisted prefill route query', () => {
    const prefillQuery = buildServiceAgreementPrefillQuery({
      companyName: '  测试公司  ',
      companyArea: '330100',
      status: 2,
    } as never)

    expect(prefillQuery).toEqual({
      prefill_companyName: '测试公司',
      prefill_companyArea: '330100',
      prefill_status: '2',
    })

    expect(
      buildServiceAgreementPrefillQueryFromPageQuery({
        filters: [
          { field: 'companyName', op: FilterOp.LIKE_RIGHT, value: '测试公司' },
          { field: 'companyArea', op: FilterOp.EQ, value: '330100' },
        ],
      }),
    ).toEqual({
      prefill_companyName: '测试公司',
      prefill_companyArea: '330100',
    })

    expect(
      parseServiceAgreementPrefillQuery({
        prefill_companyName: '测试公司',
        prefill_companyArea: ['330100'],
        prefill_status: '2',
        prefill_unknown: 'ignored',
      }),
    ).toEqual({
      companyName: '测试公司',
      companyArea: '330100',
      status: 2,
    })
  })
})
