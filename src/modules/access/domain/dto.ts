import type { QueryFilters } from '@/modules/shared/domain/query'
import type { BasePageRequest } from '@/modules/shared/domain/page'
import type { Permission } from './types'

export interface RoleRequestDTO {
  id?: number
  name: string
  description: string
  permissions: Permission[]
}

export type RolePageDTO = QueryFilters

export interface RoleAssignDTO {
  userIds: number[]
  roleId: number
}

export type PermissionPageDTO = QueryFilters

export interface RolePermissionsPageDTO {
  roleId: number
  page?: BasePageRequest<PermissionPageDTO>
}
