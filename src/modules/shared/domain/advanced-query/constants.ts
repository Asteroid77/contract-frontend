import { FilterOp, QueryLogic } from '@/modules/shared/domain/query'
import { FieldType, type FieldConfig, type OperatorConfig } from './types'

export const OPERATOR_CONFIG: Record<FilterOp, OperatorConfig> = {
  [FilterOp.EQ]: { value: FilterOp.EQ, labelKey: 'common.advancedQuery.operator.eq', needValue: true, valueCount: 1 },
  [FilterOp.NE]: { value: FilterOp.NE, labelKey: 'common.advancedQuery.operator.ne', needValue: true, valueCount: 1 },
  [FilterOp.GT]: { value: FilterOp.GT, labelKey: 'common.advancedQuery.operator.gt', needValue: true, valueCount: 1 },
  [FilterOp.GE]: { value: FilterOp.GE, labelKey: 'common.advancedQuery.operator.ge', needValue: true, valueCount: 1 },
  [FilterOp.LT]: { value: FilterOp.LT, labelKey: 'common.advancedQuery.operator.lt', needValue: true, valueCount: 1 },
  [FilterOp.LE]: { value: FilterOp.LE, labelKey: 'common.advancedQuery.operator.le', needValue: true, valueCount: 1 },
  [FilterOp.LIKE]: { value: FilterOp.LIKE, labelKey: 'common.advancedQuery.operator.like', needValue: true, valueCount: 1 },
  [FilterOp.NOT_LIKE]: {
    value: FilterOp.NOT_LIKE,
    labelKey: 'common.advancedQuery.operator.notLike',
    needValue: true,
    valueCount: 1,
  },
  [FilterOp.LIKE_LEFT]: {
    value: FilterOp.LIKE_LEFT,
    labelKey: 'common.advancedQuery.operator.likeLeft',
    needValue: true,
    valueCount: 1,
  },
  [FilterOp.LIKE_RIGHT]: {
    value: FilterOp.LIKE_RIGHT,
    labelKey: 'common.advancedQuery.operator.likeRight',
    needValue: true,
    valueCount: 1,
  },
  [FilterOp.NOT_LIKE_LEFT]: {
    value: FilterOp.NOT_LIKE_LEFT,
    labelKey: 'common.advancedQuery.operator.notLikeLeft',
    needValue: true,
    valueCount: 1,
  },
  [FilterOp.NOT_LIKE_RIGHT]: {
    value: FilterOp.NOT_LIKE_RIGHT,
    labelKey: 'common.advancedQuery.operator.notLikeRight',
    needValue: true,
    valueCount: 1,
  },
  [FilterOp.BETWEEN]: { value: FilterOp.BETWEEN, labelKey: 'common.advancedQuery.operator.between', needValue: true, valueCount: 2 },
  [FilterOp.NOT_BETWEEN]: {
    value: FilterOp.NOT_BETWEEN,
    labelKey: 'common.advancedQuery.operator.notBetween',
    needValue: true,
    valueCount: 2,
  },
  [FilterOp.IN]: { value: FilterOp.IN, labelKey: 'common.advancedQuery.operator.in', needValue: true, valueCount: 'multiple' },
  [FilterOp.NOT_IN]: {
    value: FilterOp.NOT_IN,
    labelKey: 'common.advancedQuery.operator.notIn',
    needValue: true,
    valueCount: 'multiple',
  },
  [FilterOp.IS_NULL]: { value: FilterOp.IS_NULL, labelKey: 'common.advancedQuery.operator.isNull', needValue: false, valueCount: 1 },
  [FilterOp.IS_NOT_NULL]: {
    value: FilterOp.IS_NOT_NULL,
    labelKey: 'common.advancedQuery.operator.isNotNull',
    needValue: false,
    valueCount: 1,
  },
}

const ALL_OPERATORS = Object.keys(OPERATOR_CONFIG) as FilterOp[]

export const getOperatorConfig = (op: FilterOp): OperatorConfig => OPERATOR_CONFIG[op]

export const FIELD_TYPE_OPERATORS: Record<FieldType, FilterOp[]> = {
  [FieldType.STRING]: [
    FilterOp.EQ,
    FilterOp.NE,
    FilterOp.LIKE,
    FilterOp.NOT_LIKE,
    FilterOp.LIKE_LEFT,
    FilterOp.LIKE_RIGHT,
    FilterOp.NOT_LIKE_LEFT,
    FilterOp.NOT_LIKE_RIGHT,
    FilterOp.IN,
    FilterOp.NOT_IN,
    FilterOp.IS_NULL,
    FilterOp.IS_NOT_NULL,
  ],
  [FieldType.NUMBER]: [
    FilterOp.EQ,
    FilterOp.NE,
    FilterOp.GT,
    FilterOp.GE,
    FilterOp.LT,
    FilterOp.LE,
    FilterOp.BETWEEN,
    FilterOp.NOT_BETWEEN,
    FilterOp.IN,
    FilterOp.NOT_IN,
    FilterOp.IS_NULL,
    FilterOp.IS_NOT_NULL,
  ],
  [FieldType.DATE]: [
    FilterOp.EQ,
    FilterOp.NE,
    FilterOp.GT,
    FilterOp.GE,
    FilterOp.LT,
    FilterOp.LE,
    FilterOp.BETWEEN,
    FilterOp.NOT_BETWEEN,
    FilterOp.IS_NULL,
    FilterOp.IS_NOT_NULL,
  ],
  [FieldType.DATETIME]: [
    FilterOp.EQ,
    FilterOp.NE,
    FilterOp.GT,
    FilterOp.GE,
    FilterOp.LT,
    FilterOp.LE,
    FilterOp.BETWEEN,
    FilterOp.NOT_BETWEEN,
    FilterOp.IS_NULL,
    FilterOp.IS_NOT_NULL,
  ],
  [FieldType.BOOLEAN]: [FilterOp.EQ, FilterOp.NE, FilterOp.IS_NULL, FilterOp.IS_NOT_NULL],
  [FieldType.ENUM]: [
    FilterOp.EQ,
    FilterOp.NE,
    FilterOp.IN,
    FilterOp.NOT_IN,
    FilterOp.IS_NULL,
    FilterOp.IS_NOT_NULL,
  ],
}

export const getFieldOperators = (field?: Pick<FieldConfig, 'type' | 'operators'>): FilterOp[] => {
  if (!field) return ALL_OPERATORS

  const defaultOperators = FIELD_TYPE_OPERATORS[field.type] ?? ALL_OPERATORS
  if (!field.operators || field.operators.length === 0) return defaultOperators

  const defaultSet = new Set(defaultOperators)
  const filtered = field.operators.filter((op) => defaultSet.has(op))
  return filtered.length > 0 ? filtered : defaultOperators
}

export const LOGIC_OPTIONS: Array<{ labelKey: string; value: QueryLogic }> = [
  { labelKey: 'common.advancedQuery.logic.and', value: QueryLogic.AND },
  { labelKey: 'common.advancedQuery.logic.or', value: QueryLogic.OR },
]
