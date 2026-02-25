import { workOrderRepository } from '../infrastructure/work-order-repository'
import { handlerRepository } from '../infrastructure/handler-repository'
import { categoryRepository } from '../infrastructure/category-repository'
import type {
  CreateWorkOrderDTO,
  WorkOrderCategoryForm,
  WorkOrderReplyDTO,
  WorkOrderScoreDTO,
  WorkOrderListParams,
} from '../domain/types'

export const workOrderService = {
  // User-side
  create: (dto: CreateWorkOrderDTO) => workOrderRepository.create(dto),
  getList: (params: WorkOrderListParams) => workOrderRepository.getList(params),
  getDetail: (id: number) => workOrderRepository.getDetail(id),
  getReplies: (id: number) => workOrderRepository.getReplies(id),
  addReply: (id: number, dto: WorkOrderReplyDTO) => workOrderRepository.addReply(id, dto),
  cancel: (id: number) => workOrderRepository.cancel(id),
  complete: (id: number) => workOrderRepository.complete(id),
  rejectHandler: (id: number, remark?: string) => workOrderRepository.rejectHandler(id, remark),
  reopen: (id: number) => workOrderRepository.reopen(id),
  score: (id: number, dto: WorkOrderScoreDTO) => workOrderRepository.score(id, dto),
  updateScore: (id: number, dto: WorkOrderScoreDTO) => workOrderRepository.updateScore(id, dto),
  removeBlacklist: (handlerId: number) => workOrderRepository.removeBlacklist(handlerId),

  // Handler-side
  getHandlerCategories: () => handlerRepository.getCategories(),
  getHandlerList: (params: WorkOrderListParams) => handlerRepository.getList(params),
  getHandlerPendingCount: () => handlerRepository.getPendingCount(),
  getHandlerDetail: (id: number) => handlerRepository.getDetail(id),
  claim: (id: number) => handlerRepository.claim(id),
  release: (id: number) => handlerRepository.release(id),
  getHandlerReplies: (id: number) => handlerRepository.getReplies(id),
  addHandlerReply: (id: number, dto: WorkOrderReplyDTO) => handlerRepository.addReply(id, dto),
  handlerComplete: (id: number) => handlerRepository.complete(id),
  getPerformance: () => handlerRepository.getPerformance(),

  // Category admin
  getCategories: () => categoryRepository.getAll(),
  createCategory: (dto: WorkOrderCategoryForm) => categoryRepository.create(dto),
  updateCategory: (id: number, dto: WorkOrderCategoryForm) => categoryRepository.update(id, dto),
  deleteCategory: (id: number) => categoryRepository.remove(id),
}
