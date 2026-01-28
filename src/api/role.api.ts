import type { BasePageRequest, IPage, ServerResponse } from '@/types/request'
import { createPrefixedEndpoints } from '../_utils/api/api-prefix-generator'
import type { RolePageDTO, RoleRequest, RoleVO } from './types/role'
import { useRequest } from '@/hooks/request/useRequest'

export const ROLE_API_ENDPOINT = createPrefixedEndpoints('/role', {
  PAGE: '/page',
  EDIT: '/edit',
  GET_ROLES_BY_ID: '/get',
})

export const roleApi = {
  getPage: (data: BasePageRequest<RolePageDTO>) => {
    return useRequest<ServerResponse<IPage<RoleVO>>, BasePageRequest<RolePageDTO>>({
      method: 'post',
      url: ROLE_API_ENDPOINT.PAGE,
      data,
      notify: {
        success: false,
      },
    })
  },
  getRoleListByUserId: (id: number) => {
    return useRequest<ServerResponse<RoleVO[]>, number>({
      method: 'post',
      url: ROLE_API_ENDPOINT.GET_ROLES_BY_ID,
      params: {
        id,
      },
      notify: {
        success: false,
      },
    })
  },
  edit: (data: RoleRequest) => {
    return useRequest<ServerResponse<number>, RoleRequest>({
      method: 'post',
      url: ROLE_API_ENDPOINT.EDIT,
      data,
    })
  },
}
