import type {
  BasePageRequest,
  BaseQuery,
  ConditionWrapper,
} from '@/modules/shared/application/request/types'
import type { AssignedUserOptions, Permission as DomainPermission, RoleVo } from '../domain/types'
import type { RoleAssignDTO, RoleRequestDTO } from '../domain/dto'

export type RoleItem = RoleVo
export type PermissionItem = DomainPermission
export type Permission = DomainPermission
export type AssignedUserOption = AssignedUserOptions
export type RoleForm = RoleRequestDTO
export type RoleAssignRequest = RoleAssignDTO

export interface RolePageQuery extends BaseQuery {
  name?: ConditionWrapper<string>
  description?: ConditionWrapper<string>
}

export interface PermissionPageQuery extends BaseQuery {
  name?: ConditionWrapper<string>
  description?: ConditionWrapper<string>
}

export interface RolePermissionsPageQuery {
  roleId: number
  page?: BasePageRequest<PermissionPageQuery>
}
