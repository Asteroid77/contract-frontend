import type { ServiceAgreementDetail } from './models'
import type { FilterCondition, QueryFilters, QueryGroup } from '@/modules/shared/domain/query'
import { FilterOp } from '@/modules/shared/domain/query'
import { trimToNull } from '@/modules/shared/application/mapper-utils'

const SEARCH_QUERY_KEY = 'q'
const PREFILL_QUERY_PREFIX = 'prefill_'
const VALUELESS_OPERATORS = new Set<FilterOp>([FilterOp.IS_NULL, FilterOp.IS_NOT_NULL])
const SERVICE_AGREEMENT_PREFILL_FIELDS = ['companyName', 'companyArea', 'status'] as const

type ServiceAgreementPrefillField = (typeof SERVICE_AGREEMENT_PREFILL_FIELDS)[number]
export type ServiceAgreementPrefill = Partial<
  Pick<ServiceAgreementDetail, ServiceAgreementPrefillField>
>

const getSingleQueryValue = (value: unknown): string | null => {
  if (Array.isArray(value)) return getSingleQueryValue(value[0])
  if (typeof value === 'string') return trimToNull(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return null
}

const normalizeFilterValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    const next = value
      .map((item) => (typeof item === 'string' ? trimToNull(item) : item))
      .filter((item) => item !== undefined && item !== null && item !== '')
    return next.length > 0 ? next : undefined
  }

  if (typeof value === 'string') return trimToNull(value) ?? undefined
  return value
}

const normalizeFilters = (filters?: FilterCondition[]): FilterCondition[] => {
  if (!Array.isArray(filters)) return []

  return filters.reduce<FilterCondition[]>((result, filter) => {
    if (VALUELESS_OPERATORS.has(filter.op)) {
      result.push({ ...filter, value: undefined })
      return result
    }

    const nextValue = normalizeFilterValue(filter.value)
    if (nextValue === undefined) return result

    result.push({
      ...filter,
      value: nextValue,
    })

    return result
  }, [])
}

const normalizeGroup = (group?: QueryGroup): QueryGroup | undefined => {
  if (!group) return undefined

  const filters = normalizeFilters(group.filters)
  const groups = (group.groups ?? []).map(normalizeGroup).filter(Boolean) as QueryGroup[]

  if (filters.length === 0 && groups.length === 0) return undefined

  return {
    logic: group.logic,
    ...(filters.length > 0 ? { filters } : {}),
    ...(groups.length > 0 ? { groups } : {}),
  }
}

export const normalizeServiceAgreementPageQuery = (query?: QueryFilters): QueryFilters | null => {
  if (!query) return null

  const filters = normalizeFilters(query.filters)
  const group = normalizeGroup(query.group)

  if (filters.length === 0 && !group) return null

  return {
    ...(filters.length > 0 ? { filters } : {}),
    ...(group ? { group } : {}),
  }
}

export const buildServiceAgreementPageRouteQuery = (
  query: QueryFilters | null,
): Record<string, string> => {
  const normalized = normalizeServiceAgreementPageQuery(query ?? undefined)
  if (!normalized) return {}

  return {
    [SEARCH_QUERY_KEY]: JSON.stringify(normalized),
  }
}

export const parseServiceAgreementPageRouteQuery = (
  query: Record<string, unknown>,
): QueryFilters | null => {
  const raw = getSingleQueryValue(query[SEARCH_QUERY_KEY])
  if (!raw) return null

  try {
    return normalizeServiceAgreementPageQuery(JSON.parse(raw) as QueryFilters)
  } catch {
    return null
  }
}

const collectFilters = (query: QueryFilters | null): FilterCondition[] => {
  if (!query) return []

  const groups = query.group?.groups ?? []
  const groupFilters = groups.flatMap((group) => collectFilters({ filters: group.filters, group }))

  return [...(query.filters ?? []), ...groupFilters]
}

export const extractServiceAgreementPrefill = (
  query: QueryFilters | null,
): ServiceAgreementPrefill => {
  const filters = collectFilters(normalizeServiceAgreementPageQuery(query ?? undefined))

  const companyName = filters.find((filter) => filter.field === 'companyName')?.value
  const companyArea = filters.find((filter) => filter.field === 'companyArea')?.value
  const status = filters.find((filter) => filter.field === 'status')?.value

  const prefill: ServiceAgreementPrefill = {}

  const normalizedCompanyName = typeof companyName === 'string' ? trimToNull(companyName) : null
  if (normalizedCompanyName) prefill.companyName = normalizedCompanyName

  const normalizedCompanyArea = typeof companyArea === 'string' ? trimToNull(companyArea) : null
  if (normalizedCompanyArea) prefill.companyArea = normalizedCompanyArea

  if (typeof status === 'number') {
    prefill.status = status as ServiceAgreementDetail['status']
  } else if (typeof status === 'string') {
    const parsedStatus = Number(status)
    if (!Number.isNaN(parsedStatus)) {
      prefill.status = parsedStatus as ServiceAgreementDetail['status']
    }
  }

  return prefill
}

export const canCreateServiceAgreementFromQuery = (query: QueryFilters | null): boolean => {
  const prefill = extractServiceAgreementPrefill(query)
  return !!prefill.companyName && !!prefill.companyArea
}

export const buildServiceAgreementPrefillQuery = (
  prefill: ServiceAgreementPrefill,
): Record<string, string> => {
  return SERVICE_AGREEMENT_PREFILL_FIELDS.reduce<Record<string, string>>((result, field) => {
    const rawValue = prefill[field]
    const normalizedValue = getSingleQueryValue(rawValue)

    if (!normalizedValue) return result

    result[`${PREFILL_QUERY_PREFIX}${field}`] = normalizedValue
    return result
  }, {})
}

export const buildServiceAgreementPrefillQueryFromPageQuery = (
  query: QueryFilters | null,
): Record<string, string> =>
  buildServiceAgreementPrefillQuery(extractServiceAgreementPrefill(query))

export const parseServiceAgreementPrefillQuery = (
  query: Record<string, unknown>,
): ServiceAgreementPrefill => {
  return SERVICE_AGREEMENT_PREFILL_FIELDS.reduce<ServiceAgreementPrefill>((result, field) => {
    const rawValue = getSingleQueryValue(query[`${PREFILL_QUERY_PREFIX}${field}`])

    if (!rawValue) return result

    if (field === 'status') {
      const status = Number(rawValue)
      if (!Number.isNaN(status)) {
        result.status = status as ServiceAgreementDetail['status']
      }
      return result
    }

    result[field] = rawValue as never
    return result
  }, {})
}
