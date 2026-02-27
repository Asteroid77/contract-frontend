import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { CATEGORY_ENDPOINTS } from './category-endpoints'
import type { WorkOrderCategoryVO, WorkOrderCategoryForm } from '../domain/types'

export const categoryRepository = {
  getAll: () => useRequest<WorkOrderCategoryVO[]>({ url: CATEGORY_ENDPOINTS.LIST, method: 'get' }),

  create: (dto: WorkOrderCategoryForm) =>
    useRequest<WorkOrderCategoryVO, WorkOrderCategoryForm>({
      url: CATEGORY_ENDPOINTS.CREATE,
      method: 'post',
      data: dto,
    }),

  update: (id: number, dto: WorkOrderCategoryForm) =>
    useRequest<WorkOrderCategoryVO, WorkOrderCategoryForm>({
      url: CATEGORY_ENDPOINTS.UPDATE(id),
      method: 'put',
      data: dto,
    }),

  remove: (id: number) =>
    useRequest<boolean>({ url: CATEGORY_ENDPOINTS.DELETE(id), method: 'delete' }),
}
