import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'
import type { BasePageRequest, IPage } from '@/modules/shared/domain/page'
import type { ServerResponse } from '@/modules/shared/domain/response'
import type {
  PermissionPageDTO,
  RoleAssignDTO,
  RolePageDTO,
  RolePermissionsPageDTO,
  RoleRequestDTO,
} from '../domain/dto'
import type { AssignedUserOptions, Permission, RoleVo } from '../domain/types'

const ROLE_ENDPOINTS = createPrefixedEndpoints('/role', {
  PAGE: '/page',
  EDIT: '/edit',
  GET_BY_USER_ID: '/get',
})

const PERMISSION_ENDPOINTS = createPrefixedEndpoints('/permission', {
  PAGE: '/page',
  ROLE_PAGE: '/role/page',
})

const USER_ROLE_ENDPOINTS = createPrefixedEndpoints('/user-role', {
  ASSIGNED_USERS: '/assigned-users',
  ASSIGN: '/assign',
})

export const accessRepository = {
  getRolePage: (data: BasePageRequest<RolePageDTO>) =>
    useRequest<ServerResponse<IPage<RoleVo>>, BasePageRequest<RolePageDTO>>({
      method: 'POST',
      url: ROLE_ENDPOINTS.PAGE,
      data,
      notify: {
        success: false,
      },
    }).then((resp) => resp.data),
  editRole: (data: RoleRequestDTO) =>
    useRequest<ServerResponse<number>, RoleRequestDTO>({
      method: 'POST',
      url: ROLE_ENDPOINTS.EDIT,
      data,
    }).then((resp) => resp.data),
  getRolesByUserId: (userId: number) =>
    useRequest<ServerResponse<RoleVo[]>, never>({
      method: 'GET',
      url: ROLE_ENDPOINTS.GET_BY_USER_ID,
      params: {
        userId,
      },
      notify: {
        success: false,
      },
    }).then((resp) => resp.data),
  getPermissionPage: (data: BasePageRequest<PermissionPageDTO>) =>
    useRequest<ServerResponse<IPage<Permission>>, BasePageRequest<PermissionPageDTO>>({
      method: 'POST',
      url: PERMISSION_ENDPOINTS.PAGE,
      data,
      notify: {
        success: false,
      },
    }).then((resp) => resp.data),
  getPermissionsByRoleId: (data: RolePermissionsPageDTO) =>
    useRequest<ServerResponse<IPage<Permission>>, RolePermissionsPageDTO>({
      method: 'POST',
      url: PERMISSION_ENDPOINTS.ROLE_PAGE,
      data,
      notify: {
        success: false,
      },
    }).then((resp) => resp.data),
  getAssignedUsersByRoleId: (roleId: number) =>
    useRequest<ServerResponse<AssignedUserOptions[]>, never>({
      method: 'GET',
      url: USER_ROLE_ENDPOINTS.ASSIGNED_USERS,
      params: {
        roleId,
      },
      notify: {
        success: false,
      },
    }).then((resp) => resp.data),
  assignRoleToUsers: (data: RoleAssignDTO) =>
    useRequest<ServerResponse<null>, RoleAssignDTO>({
      method: 'POST',
      url: USER_ROLE_ENDPOINTS.ASSIGN,
      data,
    }).then((resp) => resp.data),
}
