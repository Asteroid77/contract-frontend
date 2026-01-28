// 或者使用 type 别名
export type AssignedUserOptionsVO = {
  /** 用户ID */
  id: number
  /** 姓名/公司名称 */
  name: string
  /** 同名编号（用于区分同名用户） */
  discriminator: number
}
/**
 * 角色分配DTO
 */
export type RoleAssignRequest = {
  /** 用户ids */
  userIds: number[]

  /** 角色id */
  roleId: number
}
