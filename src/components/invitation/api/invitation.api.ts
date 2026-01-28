import { useRequest } from '@/hooks/request/useRequest'
import { createPrefixedEndpoints } from '@/_utils/api/api-prefix-generator'
import type { InvitationCode, InvitationUpdateRequest } from './invitation'
import type { ServerResponse } from '@/types/request'

export const INVITATION_API_ENDPOINT = createPrefixedEndpoints('/invitation', {
  CREATE: '/create',
  UPDATE: '/update',
  LIST: '/list',
  COUNT: '/count',
  DELETE: '/delete',
})

export const invitationApi = {
  createInvitationCode: () =>
    useRequest<ServerResponse<InvitationCode>, undefined>({
      url: INVITATION_API_ENDPOINT.CREATE,
      method: 'POST',
    }),
  updateInvitationCode: (data: InvitationUpdateRequest[]) =>
    useRequest<ServerResponse<InvitationCode[]>, InvitationUpdateRequest[]>({
      url: INVITATION_API_ENDPOINT.UPDATE,
      method: 'POST',
      data,
    }),
  deleteInvitationCode: (ids: number[]) =>
    useRequest<ServerResponse<boolean>, number[]>({
      url: INVITATION_API_ENDPOINT.DELETE,
      method: 'DELETE',
      data: ids,
    }),
  getInvitationCodeList: () =>
    useRequest<ServerResponse<InvitationCode[]>, undefined>({
      url: INVITATION_API_ENDPOINT.LIST,
      method: 'GET',
      notify: {
        success: false,
      },
    }),
  getInvitatedCount: () =>
    useRequest<ServerResponse<number>, undefined>({
      url: INVITATION_API_ENDPOINT.COUNT,
      method: 'GET',
      notify: {
        success: false,
      },
    }),
}
