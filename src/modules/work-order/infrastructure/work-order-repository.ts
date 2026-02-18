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
    }).then((resp) => resp.data),

  getList: (params: WorkOrderListParams) =>
    useRequest<IPage<WorkOrderSummaryVO>>({
      url: WORK_ORDER_ENDPOINTS.LIST,
      method: 'get',
      params,
    }).then((resp) => resp.data),

  getDetail: (id: number) =>
    useRequest<WorkOrderDetailVO>({
      url: WORK_ORDER_ENDPOINTS.DETAIL(id),
      method: 'get',
    }).then((resp) => resp.data),

  getReplies: (id: number) =>
    useRequest<WorkOrderReplyVO[]>({
      url: WORK_ORDER_ENDPOINTS.REPLIES(id),
      method: 'get',
    }).then((resp) => resp.data),

  addReply: (id: number, dto: WorkOrderReplyDTO) =>
    useRequest<WorkOrderReplyVO, WorkOrderReplyDTO>({
      url: WORK_ORDER_ENDPOINTS.ADD_REPLY(id),
      method: 'post',
      data: dto,
    }).then((resp) => resp.data),

  cancel: (id: number) =>
    useRequest<WorkOrderDetailVO>({
      url: WORK_ORDER_ENDPOINTS.CANCEL(id),
      method: 'post',
    }).then((resp) => resp.data),

  complete: (id: number) =>
    useRequest<WorkOrderDetailVO>({
      url: WORK_ORDER_ENDPOINTS.COMPLETE(id),
      method: 'post',
    }).then((resp) => resp.data),

  rejectHandler: (id: number, remark?: string) =>
    useRequest<WorkOrderDetailVO>({
      url: WORK_ORDER_ENDPOINTS.REJECT_HANDLER(id),
      method: 'post',
      params: remark ? { remark } : undefined,
    }).then((resp) => resp.data),

  reopen: (id: number) =>
    useRequest<WorkOrderDetailVO>({
      url: WORK_ORDER_ENDPOINTS.REOPEN(id),
      method: 'post',
    }).then((resp) => resp.data),

  score: (id: number, dto: WorkOrderScoreDTO) =>
    useRequest<WorkOrderDetailVO, WorkOrderScoreDTO>({
      url: WORK_ORDER_ENDPOINTS.SCORE(id),
      method: 'post',
      data: dto,
    }).then((resp) => resp.data),

  updateScore: (id: number, dto: WorkOrderScoreDTO) =>
    useRequest<WorkOrderDetailVO, WorkOrderScoreDTO>({
      url: WORK_ORDER_ENDPOINTS.SCORE(id),
      method: 'put',
      data: dto,
    }).then((resp) => resp.data),

  removeBlacklist: (handlerId: number) =>
    useRequest<boolean>({
      url: WORK_ORDER_ENDPOINTS.REMOVE_BLACKLIST(handlerId),
      method: 'delete',
    }).then((resp) => resp.data),
}
