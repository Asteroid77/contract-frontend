import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'
import type { BasePageRequest, IPage } from '@/modules/shared/domain/page'
import type { ServerResponse } from '@/modules/shared/domain/response'
import type { EditRemarkDTO } from '../domain/dto'
import type { InvitationCode, InvitationRecord } from '../domain/types'

const INVITATION_ENDPOINTS = createPrefixedEndpoints('/invitation', {
  CREATE: '/create',
  UPDATE: '/update',
  LIST: '/list',
  COUNT: '/count',
  DELETE: '/delete',
})

const INVITATION_RECORD_ENDPOINTS = createPrefixedEndpoints('/invitation_record', {
  LIST: '/list',
})

export const invitationRepository = {
  createInvitationCode: () =>
    useRequest<ServerResponse<InvitationCode>, undefined>({
      url: INVITATION_ENDPOINTS.CREATE,
      method: 'POST',
    }).then((resp) => resp.data),
  updateInvitationCode: (data: EditRemarkDTO[]) =>
    useRequest<ServerResponse<InvitationCode[]>, EditRemarkDTO[]>({
      url: INVITATION_ENDPOINTS.UPDATE,
      method: 'POST',
      data,
    }).then((resp) => resp.data),
  deleteInvitationCode: (ids: number[]) =>
    useRequest<ServerResponse<boolean>, number[]>({
      url: INVITATION_ENDPOINTS.DELETE,
      method: 'DELETE',
      data: ids,
    }).then((resp) => resp.data),
  getInvitationCodeList: () =>
    useRequest<ServerResponse<InvitationCode[]>, undefined>({
      url: INVITATION_ENDPOINTS.LIST,
      method: 'GET',
      notify: {
        success: false,
      },
    }).then((resp) => resp.data),
  getInvitedCount: () =>
    useRequest<ServerResponse<number>, undefined>({
      url: INVITATION_ENDPOINTS.COUNT,
      method: 'GET',
      notify: {
        success: false,
      },
    }).then((resp) => resp.data),
  getInvitationRecordPage: (data: BasePageRequest<unknown>) =>
    useRequest<ServerResponse<IPage<InvitationRecord>>, BasePageRequest<unknown>>({
      url: INVITATION_RECORD_ENDPOINTS.LIST,
      method: 'POST',
      data,
      notify: {
        success: false,
      },
    }).then((resp) => resp.data),
}
