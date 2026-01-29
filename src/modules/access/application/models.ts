import type { BasePageRequest, BaseQuery, ConditionWrapper } from '@/modules/shared/application/request/types'
import type {
  AssignedUserOptions,
  Permission as DomainPermission,
  RoleVo,
} from '../domain/types'
import type { RoleAssignDTO, RoleRequestDTO } from '../domain/dto'

export type RoleVO = RoleVo
export type PermissionVO = DomainPermission
export type Permission = DomainPermission
export type AssignedUserOptionsVO = AssignedUserOptions
export type RoleRequest = RoleRequestDTO
export type RoleAssignRequest = RoleAssignDTO

export interface RolePageDTO extends BaseQuery {
  name?: ConditionWrapper<string>
  description?: ConditionWrapper<string>
}

export interface PermissionPageDTO extends BaseQuery {
  name?: ConditionWrapper<string>
  description?: ConditionWrapper<string>
}

export interface RolePermissionsPageDTO {
  roleId: number
  page?: BasePageRequest<PermissionPageDTO>
}
