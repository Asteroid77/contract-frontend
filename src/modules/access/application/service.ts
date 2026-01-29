import type { BasePageRequest, IPage } from '@/modules/shared/application/request/types'
import { toDomainPageRequest } from '@/modules/shared/application/query/legacy-query-adapter'
import type {
  AssignedUserOptionsVO,
  PermissionPageDTO,
  RoleAssignRequest,
  RolePageDTO,
  RolePermissionsPageDTO,
  RoleRequest,
  RoleVO,
} from './models'
import type { Permission } from '../domain/types'
import { accessRepository } from '../infrastructure/access-repository'

export const accessService = {
  getRolePage: (pageRequest: BasePageRequest<RolePageDTO>): Promise<IPage<RoleVO>> =>
    accessRepository.getRolePage(toDomainPageRequest(pageRequest)),
  editRole: (data: RoleRequest): Promise<number> => accessRepository.editRole(data),
  getRolesByUserId: (userId: number): Promise<RoleVO[]> =>
    accessRepository.getRolesByUserId(userId),
  getPermissionPage: (
    pageRequest: BasePageRequest<PermissionPageDTO>,
  ): Promise<IPage<Permission>> => accessRepository.getPermissionPage(toDomainPageRequest(pageRequest)),
  getPermissionsByRoleId: (payload: RolePermissionsPageDTO): Promise<IPage<Permission>> =>
    accessRepository.getPermissionsByRoleId({
      roleId: payload.roleId,
      page: payload.page ? toDomainPageRequest(payload.page) : undefined,
    }),
  getAssignedUsersByRoleId: (roleId: number): Promise<AssignedUserOptionsVO[]> =>
    accessRepository.getAssignedUsersByRoleId(roleId),
  assignRoleToUsers: (data: RoleAssignRequest): Promise<null> =>
    accessRepository.assignRoleToUsers(data),
}
