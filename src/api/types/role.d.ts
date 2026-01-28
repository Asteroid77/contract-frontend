import type { Permission, Role } from '@/types/account'
import type { BaseQuery, ConditionWrapper } from '@/types/request'

export type RoleVO = Role & {
  /**
   * 角色所拥有的权限列表
   */
  permissions: Permission[]
}

/**
 * 角色分页查询数据传输对象
 */
export interface RolePageDTO extends BaseQuery {
  /**
   * 角色名称
   */
  name?: ConditionWrapper<string>

  /**
   * 角色描述
   */
  description?: ConditionWrapper<string>
}

export type RoleRequest = RoleVO
