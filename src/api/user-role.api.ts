import { useRequest } from '@/hooks/request/useRequest'
import { createPrefixedEndpoints } from '../_utils/api/api-prefix-generator'
import type { AssignedUserOptionsVO, RoleAssignRequest } from './types/user-role'

export const USER_ROLE_API_ENDPOINT = createPrefixedEndpoints('/user-role', {
  GET_ASSIGNED_USERS: '/assigned-users',
  ASSIGN: '/assign',
})

export const userRoleApi = {
  getAssignedUsersByRoleId: (roleId: number) => {
    return useRequest<AssignedUserOptionsVO[], number>({
      url: USER_ROLE_API_ENDPOINT.GET_ASSIGNED_USERS,
      method: 'get',
      params: roleId,
      notify: {
        success: false,
      },
    })
  },
  assign: (data: RoleAssignRequest) => {
    return useRequest<null, RoleAssignRequest>({
      url: USER_ROLE_API_ENDPOINT.ASSIGN,
      method: 'post',
      data,
    })
  },
}
