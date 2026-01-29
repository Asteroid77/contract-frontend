export enum FilterOp {
  EQ = 'EQ',
  NE = 'NE',
  GT = 'GT',
  GE = 'GE',
  LT = 'LT',
  LE = 'LE',
  LIKE = 'LIKE',
  NOT_LIKE = 'NOT_LIKE',
  LIKE_LEFT = 'LIKE_LEFT',
  LIKE_RIGHT = 'LIKE_RIGHT',
  NOT_LIKE_LEFT = 'NOT_LIKE_LEFT',
  NOT_LIKE_RIGHT = 'NOT_LIKE_RIGHT',
  BETWEEN = 'BETWEEN',
  NOT_BETWEEN = 'NOT_BETWEEN',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
}

export enum QueryLogic {
  AND = 'AND',
  OR = 'OR',
}

export interface FilterCondition {
  field: string
  op: FilterOp
  value?: unknown
}

export interface QueryGroup {
  logic?: QueryLogic
  filters?: FilterCondition[]
  groups?: QueryGroup[]
}

export interface QueryFilters {
  filters?: FilterCondition[]
  group?: QueryGroup
}
