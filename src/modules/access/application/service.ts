import type { BasePageRequest, IPage } from '@/modules/shared/application/request/types'
import { toDomainPageRequest } from '@/modules/shared/application/query/legacy-query-adapter'
import type {
  AssignedUserOption,
  PermissionPageQuery,
  RoleAssignRequest,
  RolePageQuery,
  RolePermissionsPageQuery,
  RoleForm,
  RoleItem,
} from './models'
import type { Permission } from '../domain/types'
import { accessRepository } from '../infrastructure/access-repository'

export const accessService = {
  getRolePage: (pageRequest: BasePageRequest<RolePageQuery>): Promise<IPage<RoleItem>> =>
    accessRepository.getRolePage(toDomainPageRequest(pageRequest)),
  editRole: (data: RoleForm): Promise<number> => accessRepository.editRole(data),
  getRolesByUserId: (userId: number): Promise<RoleItem[]> =>
    accessRepository.getRolesByUserId(userId),
  getPermissionPage: (
    pageRequest: BasePageRequest<PermissionPageQuery>,
  ): Promise<IPage<Permission>> =>
    accessRepository.getPermissionPage(toDomainPageRequest(pageRequest)),
  getPermissionsByRoleId: (payload: RolePermissionsPageQuery): Promise<IPage<Permission>> =>
    accessRepository.getPermissionsByRoleId({
      roleId: payload.roleId,
      page: payload.page ? toDomainPageRequest(payload.page) : undefined,
    }),
  getAssignedUsersByRoleId: (roleId: number): Promise<AssignedUserOption[]> =>
    accessRepository.getAssignedUsersByRoleId(roleId),
  assignRoleToUsers: (data: RoleAssignRequest): Promise<null> =>
    accessRepository.assignRoleToUsers(data),
}
