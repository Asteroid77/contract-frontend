import type {
  BasePageRequest as LegacyBasePageRequest,
  ConditionWrapper,
} from '@/modules/shared/application/request/types'
import type { BasePageRequest as DomainBasePageRequest } from '@/modules/shared/domain/page'
import { FilterOp, type FilterCondition, type QueryFilters } from '@/modules/shared/domain/query'

export type LegacyQuery = Record<string, ConditionWrapper<unknown> | undefined>

const conditionToOp: Record<string, FilterOp> = {
  eq: FilterOp.EQ,
  ne: FilterOp.NE,
  gt: FilterOp.GT,
  gte: FilterOp.GE,
  lt: FilterOp.LT,
  lte: FilterOp.LE,
  like: FilterOp.LIKE,
  in: FilterOp.IN,
  notIn: FilterOp.NOT_IN,
  between: FilterOp.BETWEEN,
  isNull: FilterOp.IS_NULL,
  isNotNull: FilterOp.IS_NOT_NULL,
}

const toFilterCondition = (
  field: string,
  wrapper: ConditionWrapper<unknown>,
): FilterCondition | null => {
  const op = conditionToOp[wrapper.condition]
  if (!op) return null
  return {
    field,
    op,
    value: wrapper.value,
  }
}

export const toQueryFilters = (query?: LegacyQuery): QueryFilters | undefined => {
  if (!query) return undefined
  const filters = Object.entries(query)
    .map(([field, wrapper]) => (wrapper ? toFilterCondition(field, wrapper) : null))
    .filter((item): item is FilterCondition => Boolean(item))

  if (filters.length === 0) return undefined
  return { filters }
}

const normalizeSize = (size?: LegacyBasePageRequest<LegacyQuery>['size']) => {
  if (size == null) return undefined
  if (typeof size === 'string') {
    const parsed = Number(size)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return size
}

export const toDomainPageRequest = (
  request: LegacyBasePageRequest<LegacyQuery>,
): DomainBasePageRequest<QueryFilters> => {
  return {
    page: request.page,
    size: normalizeSize(request.size),
    orders: request.orders?.map((item) => ({
      column: item.column,
      direction: item.direction ?? 'ASC',
    })),
    query: toQueryFilters(request.query),
  }
}
