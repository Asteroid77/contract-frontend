import { describe, expect, it, vi } from 'vitest'
import { useListQueryState } from '@/modules/shared/presentation/advanced-query/useListQueryState'

describe('useListQueryState', () => {
  it('keeps default pagination and updates page/pageSize through handlers', () => {
    const { pagination } = useListQueryState()

    expect(pagination.page).toBe(1)
    expect(pagination.pageSize).toBe(10)
    expect(pagination.pageSizes).toEqual([10, 50, 100])

    const onChange = Array.isArray(pagination.onChange)
      ? pagination.onChange[0]
      : pagination.onChange
    onChange?.(3)
    expect(pagination.page).toBe(3)

    const onUpdatePageSize = Array.isArray(pagination.onUpdatePageSize)
      ? pagination.onUpdatePageSize[0]
      : pagination.onUpdatePageSize
    onUpdatePageSize?.(50)
    expect(pagination.pageSize).toBe(50)
    expect(pagination.page).toBe(1)
  })

  it('returns true when search query is unchanged on first page', () => {
    const refetchSpy = vi.fn()
    const { handleSearch } = useListQueryState({ onForceRefetch: refetchSpy })

    const shouldForceRefetch = handleSearch({})

    expect(shouldForceRefetch).toBe(true)
    expect(refetchSpy).toHaveBeenCalledTimes(1)
  })

  it('returns false when search happens on non-first page', () => {
    const refetchSpy = vi.fn()
    const { pagination, handleSearch } = useListQueryState({ onForceRefetch: refetchSpy })
    pagination.page = 2

    const shouldForceRefetch = handleSearch({ filters: [] })

    expect(shouldForceRefetch).toBe(false)
    expect(refetchSpy).not.toHaveBeenCalled()
    expect(pagination.page).toBe(1)
  })

  it('returns true when reset is called on first page with empty applied query', () => {
    const refetchSpy = vi.fn()
    const { draftQueryFilters, appliedQueryFilters, handleReset } = useListQueryState({
      onForceRefetch: refetchSpy,
    })

    draftQueryFilters.value = { filters: [{ key: 'name', op: '=', value: 'alice' }] as never[] }
    appliedQueryFilters.value = null

    const shouldForceRefetch = handleReset()

    expect(shouldForceRefetch).toBe(true)
    expect(refetchSpy).toHaveBeenCalledTimes(1)
    expect(draftQueryFilters.value).toEqual({})
    expect(appliedQueryFilters.value).toBeNull()
  })

  it('binds search/reset handlers that trigger refetch only when needed', () => {
    const refetch = vi.fn()
    const { pagination, bindRefetchHandlers } = useListQueryState()
    const { onSearch, onReset } = bindRefetchHandlers(refetch)

    onSearch({})
    expect(refetch).toHaveBeenCalledTimes(1)

    refetch.mockClear()
    pagination.page = 2
    onSearch({})
    expect(refetch).not.toHaveBeenCalled()

    pagination.page = 1
    onReset()
    expect(refetch).toHaveBeenCalledTimes(1)
  })
})
