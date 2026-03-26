import { describe, expect, it } from 'vitest'
import { FilterOp, QueryLogic } from '@/modules/shared/domain/query'
import { FieldType } from '@/modules/shared/domain/advanced-query'
import {
  FIELD_TYPE_OPERATORS,
  getFieldOperators,
  getOperatorConfig,
  LOGIC_OPTIONS,
  OPERATOR_CONFIG,
} from '@/modules/shared/domain/advanced-query/constants'

describe('advanced-query/constants', () => {
  it('keeps operator config value consistent with its key', () => {
    ;(Object.keys(OPERATOR_CONFIG) as FilterOp[]).forEach((op) => {
      expect(OPERATOR_CONFIG[op].value).toBe(op)
    })
  })

  it('returns operator config by getOperatorConfig', () => {
    expect(getOperatorConfig(FilterOp.EQ)).toEqual(OPERATOR_CONFIG[FilterOp.EQ])
    expect(getOperatorConfig(FilterOp.BETWEEN)).toEqual(OPERATOR_CONFIG[FilterOp.BETWEEN])
    expect(getOperatorConfig(FilterOp.IS_NULL)).toEqual(OPERATOR_CONFIG[FilterOp.IS_NULL])
  })

  it('defines expected operator sets by field type', () => {
    expect(FIELD_TYPE_OPERATORS[FieldType.STRING]).toContain(FilterOp.LIKE)
    expect(FIELD_TYPE_OPERATORS[FieldType.STRING]).not.toContain(FilterOp.BETWEEN)

    expect(FIELD_TYPE_OPERATORS[FieldType.NUMBER]).toContain(FilterOp.BETWEEN)
    expect(FIELD_TYPE_OPERATORS[FieldType.NUMBER]).not.toContain(FilterOp.LIKE)

    expect(FIELD_TYPE_OPERATORS[FieldType.DATE]).toContain(FilterOp.BETWEEN)
    expect(FIELD_TYPE_OPERATORS[FieldType.DATETIME]).toContain(FilterOp.NOT_BETWEEN)

    expect(FIELD_TYPE_OPERATORS[FieldType.BOOLEAN]).toEqual([
      FilterOp.EQ,
      FilterOp.NE,
      FilterOp.IS_NULL,
      FilterOp.IS_NOT_NULL,
    ])

    expect(FIELD_TYPE_OPERATORS[FieldType.ENUM]).toContain(FilterOp.IN)
    expect(FIELD_TYPE_OPERATORS[FieldType.ENUM]).not.toContain(FilterOp.LIKE_LEFT)

    expect(FIELD_TYPE_OPERATORS[FieldType.PCA]).toEqual([
      FilterOp.EQ,
      FilterOp.NE,
      FilterOp.IS_NULL,
      FilterOp.IS_NOT_NULL,
    ])
  })

  it('exposes stable logic options for AND/OR', () => {
    expect(LOGIC_OPTIONS).toEqual([
      { labelKey: 'common.advancedQuery.logic.and', value: QueryLogic.AND },
      { labelKey: 'common.advancedQuery.logic.or', value: QueryLogic.OR },
    ])
  })

  it('returns configured operators when field defines a subset', () => {
    expect(
      getFieldOperators({
        type: FieldType.STRING,
        operators: [FilterOp.LIKE_RIGHT, FilterOp.EQ],
      }),
    ).toEqual([FilterOp.LIKE_RIGHT, FilterOp.EQ])
  })

  it('falls back to type operators when configured operators are invalid for type', () => {
    expect(
      getFieldOperators({
        type: FieldType.NUMBER,
        operators: [FilterOp.LIKE],
      }),
    ).toEqual(FIELD_TYPE_OPERATORS[FieldType.NUMBER])
  })
})
