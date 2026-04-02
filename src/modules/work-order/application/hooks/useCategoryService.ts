import { workOrderService } from '../work-order-service'
import type { WorkOrderCategoryForm } from '../../domain/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'

export const categoryKeys = {
  ALL: ['work-order-categories'] as const,
  LIST: ['work-order-categories', 'list'] as const,
}

export const useCategoryList = (options?: { enabled?: Ref<boolean> | boolean }) => {
  return useQuery({
    queryKey: categoryKeys.LIST,
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => workOrderService.getCategories()),
    enabled: computed(() => unref(options?.enabled ?? true)),
    staleTime: 5 * 60 * 1000,
  })
}

export const useCreateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: WorkOrderCategoryForm) => workOrderService.createCategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.ALL })
    },
  })
}

export const useUpdateCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: WorkOrderCategoryForm }) =>
      workOrderService.updateCategory(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.ALL })
    },
  })
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => workOrderService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.ALL })
    },
  })
}
