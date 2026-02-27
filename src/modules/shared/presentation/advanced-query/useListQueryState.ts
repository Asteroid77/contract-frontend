import { reactive, ref } from 'vue'
import type { QueryFilters } from '@/modules/shared/domain/query'

type UseListQueryStateOptions = {
  initialPage?: number
  initialPageSize?: number
  pageSizes?: number[]
  onForceRefetch?: () => void
}

type PaginationChangeHandler = (page: number) => void
type PaginationUpdatePageSizeHandler = (pageSize: number) => void
type RefetchHandler = () => void

export type ListQueryRefetchHandlers = {
  onSearch: (query?: QueryFilters) => void
  onReset: () => void
}

export type ListPaginationState = {
  page: number
  pageSize: number
  showSizePicker: boolean
  pageSizes: number[]
  onChange: PaginationChangeHandler
  onUpdatePageSize: PaginationUpdatePageSizeHandler
}

const normalizeQueryFilters = (query: QueryFilters): QueryFilters | null =>
  query.filters?.length || query.group ? query : null

const isSameQuery = (left: QueryFilters | null, right: QueryFilters | null) =>
  JSON.stringify(left ?? {}) === JSON.stringify(right ?? {})

export function useListQueryState(options: UseListQueryStateOptions = {}) {
  const draftQueryFilters = ref<QueryFilters>({})
  const appliedQueryFilters = ref<QueryFilters | null>(null)

  const pagination = reactive<ListPaginationState>({
    page: options.initialPage ?? 1,
    pageSize: options.initialPageSize ?? 10,
    showSizePicker: true,
    pageSizes: options.pageSizes ?? [10, 50, 100],
    onChange: (page: number) => {
      pagination.page = page
    },
    onUpdatePageSize: (pageSize: number) => {
      pagination.pageSize = pageSize
      pagination.page = 1
    },
  })

  const handleSearch = (query?: QueryFilters) => {
    const nextApplied = normalizeQueryFilters(query ?? draftQueryFilters.value)
    const shouldForceRefetch =
      pagination.page === 1 && isSameQuery(appliedQueryFilters.value, nextApplied)

    appliedQueryFilters.value = nextApplied
    pagination.page = 1

    if (shouldForceRefetch) options.onForceRefetch?.()

    return shouldForceRefetch
  }

  const handleReset = () => {
    const shouldForceRefetch = pagination.page === 1 && appliedQueryFilters.value == null

    draftQueryFilters.value = {}
    appliedQueryFilters.value = null
    pagination.page = 1

    if (shouldForceRefetch) options.onForceRefetch?.()

    return shouldForceRefetch
  }

  const bindRefetchHandlers = (refetch: RefetchHandler): ListQueryRefetchHandlers => ({
    onSearch: (query?: QueryFilters) => {
      if (handleSearch(query)) refetch()
    },
    onReset: () => {
      if (handleReset()) refetch()
    },
  })

  return {
    draftQueryFilters,
    appliedQueryFilters,
    pagination,
    handleSearch,
    handleReset,
    bindRefetchHandlers,
  }
}
