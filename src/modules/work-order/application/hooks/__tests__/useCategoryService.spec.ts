import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  categoryKeys,
  useCategoryList,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/modules/work-order/application/hooks/useCategoryService'
import { workOrderService } from '@/modules/work-order/application/work-order-service'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import type { WorkOrderCategoryForm, WorkOrderCategoryVO } from '@/modules/work-order/domain/types'

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn((options) => options),
  useMutation: vi.fn((options) => options),
  useQueryClient: vi.fn(),
}))

vi.mock('@/modules/work-order/application/work-order-service', () => ({
  workOrderService: {
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}))

vi.mock('@/app/infrastructure/query/query-request-context', () => ({
  withQueryRequestContext: vi.fn((_queryKey, _ctx, runner) => runner()),
}))

const queryClient = {
  invalidateQueries: vi.fn(),
}

type QueryOptionsLike<TData = unknown> = {
  queryKey: unknown
  enabled?: { value: boolean }
  staleTime?: number
  queryFn: (ctx: { queryKey: unknown }) => Promise<TData> | TData
}

type MutationOptionsLike<TData = unknown, TVariables = unknown> = {
  mutationFn: (variables: TVariables) => Promise<TData> | TData
  onSuccess?: (data: TData, variables: TVariables) => void
}

const getLatestQueryOptions = <TData = unknown>(): QueryOptionsLike<TData> => {
  const latestCall = vi.mocked(useQuery).mock.calls.at(-1)
  if (!latestCall) {
    throw new Error('useQuery should be called before reading options')
  }
  return latestCall[0] as QueryOptionsLike<TData>
}

const getLatestMutationOptions = <TData = unknown, TVariables = unknown>(): MutationOptionsLike<
  TData,
  TVariables
> => {
  const latestCall = vi.mocked(useMutation).mock.calls.at(-1)
  if (!latestCall) {
    throw new Error('useMutation should be called before reading options')
  }
  return latestCall[0] as MutationOptionsLike<TData, TVariables>
}

describe('useCategoryService hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useQueryClient).mockReturnValue(queryClient as never)
    vi.mocked(workOrderService.getCategories).mockResolvedValue([
      {
        id: 1,
        name: '电表',
        permissionCode: 'work-order:meter',
      },
    ] as never)
    vi.mocked(workOrderService.createCategory).mockResolvedValue({
      id: 2,
      name: '发票',
      permissionCode: 'work-order:invoice',
    } as never)
    vi.mocked(workOrderService.updateCategory).mockResolvedValue({
      id: 2,
      name: '发票-更新',
      permissionCode: 'work-order:invoice',
    } as never)
    vi.mocked(workOrderService.deleteCategory).mockResolvedValue(true as never)
  })

  it('defines stable category keys', () => {
    expect(categoryKeys.ALL).toEqual(['work-order-categories'])
    expect(categoryKeys.LIST).toEqual(['work-order-categories', 'list'])
  })

  it('useCategoryList delegates queryFn and respects enabled ref', async () => {
    const enabled = ref(false)

    useCategoryList({ enabled })
    const options = getLatestQueryOptions<WorkOrderCategoryVO[]>()

    expect(options.queryKey).toEqual(categoryKeys.LIST)
    expect(options.staleTime).toBe(5 * 60 * 1000)
    expect((options.enabled as { value: boolean }).value).toBe(false)

    const result = await options.queryFn({ queryKey: categoryKeys.LIST })

    expect(withQueryRequestContext).toHaveBeenCalledWith(
      categoryKeys.LIST,
      { queryKey: categoryKeys.LIST },
      expect.any(Function),
    )
    expect(workOrderService.getCategories).toHaveBeenCalledTimes(1)
    expect(result).toEqual([
      {
        id: 1,
        name: '电表',
        permissionCode: 'work-order:meter',
      },
    ])

    enabled.value = true
    expect((options.enabled as { value: boolean }).value).toBe(true)
  })

  it('useCreateCategory delegates mutation and invalidates category cache on success', async () => {
    useCreateCategory()
    const options = getLatestMutationOptions<WorkOrderCategoryVO, WorkOrderCategoryForm>()

    const payload = {
      name: '发票',
      permissionCode: 'work-order:invoice',
    }

    await options.mutationFn(payload)
    expect(workOrderService.createCategory).toHaveBeenCalledWith(payload)

    if (!options.onSuccess) throw new Error('onSuccess should be defined')
    options.onSuccess(
      {
        id: 2,
        name: '发票',
        permissionCode: 'work-order:invoice',
      },
      payload,
    )
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: categoryKeys.ALL,
    })
  })

  it('useUpdateCategory and useDeleteCategory invalidate category cache on success', async () => {
    useUpdateCategory()
    const updateOptions = getLatestMutationOptions<
      WorkOrderCategoryVO,
      { id: number; dto: WorkOrderCategoryForm }
    >()

    const updatePayload = {
      id: 2,
      dto: {
        name: '发票-更新',
        permissionCode: 'work-order:invoice',
      },
    }

    await updateOptions.mutationFn(updatePayload)
    expect(workOrderService.updateCategory).toHaveBeenCalledWith(2, updatePayload.dto)

    if (!updateOptions.onSuccess) throw new Error('onSuccess should be defined')
    updateOptions.onSuccess(
      {
        id: 2,
        name: '发票-更新',
        permissionCode: 'work-order:invoice',
      },
      updatePayload,
    )
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: categoryKeys.ALL,
    })

    useDeleteCategory()
    const deleteOptions = getLatestMutationOptions<boolean, number>()

    await deleteOptions.mutationFn(2)
    expect(workOrderService.deleteCategory).toHaveBeenCalledWith(2)

    if (!deleteOptions.onSuccess) throw new Error('onSuccess should be defined')
    deleteOptions.onSuccess(true, 2)
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: categoryKeys.ALL,
    })
  })
})
