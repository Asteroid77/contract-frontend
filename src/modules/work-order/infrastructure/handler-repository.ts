import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { HANDLER_ENDPOINTS } from './work-order-endpoints'
import type { IPage } from '@/modules/shared/domain/page'
import type {
  WorkOrderDetailVO,
  WorkOrderSummaryVO,
  WorkOrderReplyVO,
  WorkOrderReplyDTO,
  WorkOrderCategoryVO,
  WorkOrderPerformanceVO,
  PendingCountVO,
  WorkOrderListParams,
} from '../domain/types'

export const handlerRepository = {
  getCategories: () =>
    useRequest<WorkOrderCategoryVO[]>({
      url: HANDLER_ENDPOINTS.CATEGORIES,
      method: 'get',
    }).then((resp) => resp.data),

  getList: (params: WorkOrderListParams) =>
    useRequest<IPage<WorkOrderSummaryVO>>({
      url: HANDLER_ENDPOINTS.LIST,
      method: 'get',
      params,
    }).then((resp) => resp.data),

  getPendingCount: () =>
    useRequest<PendingCountVO>({
      url: HANDLER_ENDPOINTS.PENDING_COUNT,
      method: 'get',
    }).then((resp) => resp.data),

  getDetail: (id: number) =>
    useRequest<WorkOrderDetailVO>({
      url: HANDLER_ENDPOINTS.DETAIL(id),
      method: 'get',
    }).then((resp) => resp.data),

  claim: (id: number) =>
    useRequest<WorkOrderDetailVO>({
      url: HANDLER_ENDPOINTS.CLAIM(id),
      method: 'post',
    }).then((resp) => resp.data),

  release: (id: number) =>
    useRequest<WorkOrderDetailVO>({
      url: HANDLER_ENDPOINTS.RELEASE(id),
      method: 'post',
    }).then((resp) => resp.data),

  getReplies: (id: number) =>
    useRequest<WorkOrderReplyVO[]>({
      url: HANDLER_ENDPOINTS.REPLIES(id),
      method: 'get',
    }).then((resp) => resp.data),

  addReply: (id: number, dto: WorkOrderReplyDTO) =>
    useRequest<WorkOrderReplyVO, WorkOrderReplyDTO>({
      url: HANDLER_ENDPOINTS.ADD_REPLY(id),
      method: 'post',
      data: dto,
    }).then((resp) => resp.data),

  complete: (id: number) =>
    useRequest<WorkOrderDetailVO>({
      url: HANDLER_ENDPOINTS.COMPLETE(id),
      method: 'post',
    }).then((resp) => resp.data),

  getPerformance: () =>
    useRequest<WorkOrderPerformanceVO>({
      url: HANDLER_ENDPOINTS.PERFORMANCE,
      method: 'get',
    }).then((resp) => resp.data),
}
