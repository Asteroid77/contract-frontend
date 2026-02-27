import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { WORK_ORDER_ENDPOINTS } from './work-order-endpoints'
import type { IPage } from '@/modules/shared/domain/page'
import type {
  WorkOrderDetailVO,
  WorkOrderSummaryVO,
  WorkOrderReplyVO,
  CreateWorkOrderDTO,
  WorkOrderReplyDTO,
  WorkOrderScoreDTO,
  WorkOrderListParams,
} from '../domain/types'

export const workOrderRepository = {
  create: (dto: CreateWorkOrderDTO) =>
    useRequest<WorkOrderDetailVO, CreateWorkOrderDTO>({
      url: WORK_ORDER_ENDPOINTS.CREATE,
      method: 'post',
      data: dto,
      responseShape: 'data',
    }),

  getList: (params: WorkOrderListParams) =>
    useRequest<IPage<WorkOrderSummaryVO>>({
      url: WORK_ORDER_ENDPOINTS.LIST,
      method: 'get',
      params,
      responseShape: 'data',
    }),

  getDetail: (id: number) =>
    useRequest<WorkOrderDetailVO>({
      url: WORK_ORDER_ENDPOINTS.DETAIL(id),
      method: 'get',
      responseShape: 'data',
    }),

  getReplies: (id: number) =>
    useRequest<WorkOrderReplyVO[]>({
      url: WORK_ORDER_ENDPOINTS.REPLIES(id),
      method: 'get',
      responseShape: 'data',
    }),

  addReply: (id: number, dto: WorkOrderReplyDTO) =>
    useRequest<WorkOrderReplyVO, WorkOrderReplyDTO>({
      url: WORK_ORDER_ENDPOINTS.ADD_REPLY(id),
      method: 'post',
      data: dto,
      responseShape: 'data',
    }),

  cancel: (id: number) =>
    useRequest<WorkOrderDetailVO>({
      url: WORK_ORDER_ENDPOINTS.CANCEL(id),
      method: 'post',
      responseShape: 'data',
    }),

  complete: (id: number) =>
    useRequest<WorkOrderDetailVO>({
      url: WORK_ORDER_ENDPOINTS.COMPLETE(id),
      method: 'post',
      responseShape: 'data',
    }),

  rejectHandler: (id: number, remark?: string) =>
    useRequest<WorkOrderDetailVO>({
      url: WORK_ORDER_ENDPOINTS.REJECT_HANDLER(id),
      method: 'post',
      params: remark ? { remark } : undefined,
      responseShape: 'data',
    }),

  reopen: (id: number) =>
    useRequest<WorkOrderDetailVO>({
      url: WORK_ORDER_ENDPOINTS.REOPEN(id),
      method: 'post',
      responseShape: 'data',
    }),

  score: (id: number, dto: WorkOrderScoreDTO) =>
    useRequest<WorkOrderDetailVO, WorkOrderScoreDTO>({
      url: WORK_ORDER_ENDPOINTS.SCORE(id),
      method: 'post',
      data: dto,
      responseShape: 'data',
    }),

  updateScore: (id: number, dto: WorkOrderScoreDTO) =>
    useRequest<WorkOrderDetailVO, WorkOrderScoreDTO>({
      url: WORK_ORDER_ENDPOINTS.SCORE(id),
      method: 'put',
      data: dto,
      responseShape: 'data',
    }),

  removeBlacklist: (handlerId: number) =>
    useRequest<boolean>({
      url: WORK_ORDER_ENDPOINTS.REMOVE_BLACKLIST(handlerId),
      method: 'delete',
      responseShape: 'data',
    }),
}
