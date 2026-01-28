export type InvitationUpdateRequest = {
  /**
   * 主键
   */
  id: number
  /**
   * 邀请码备注
   */
  remark: string | undefined | null
}
export type InvitationCodeStatus = {
  ACTIVE: 1
  INACTIVE: 0
}
/**
 * 邀请码数据结构
 */
export interface InvitationCode {
  /**
   * 主键ID
   * @example 1
   */
  id: number

  /**
   * 邀请码
   * @example "ABC12345"
   */
  code: string

  /**
   * 创建人ID
   * @example 10001
   */
  creatorId: number

  /**
   * 备注
   * @example "微信渠道"
   */
  remark: string | null // 根据Java类型，remark可以为null，因此设为可选

  /**
   * 状态：0-不可用，1-可用
   * @example 1
   */
  status: InvitationCodeStatus[keyof InvitationCodeStatus]

  /**
   * 成功邀请数量
   * @example 5
   */
  usedCount: number

  /**
   * 创建时间 (通常为ISO 8601格式的字符串)
   * @example "2023-01-01T12:00:00"
   */
  createdTime: string

  /**
   * 更新时间 (通常为ISO 8601格式的字符串)
   * @example "2023-01-02T12:00:00"
   */
  updatedTime: string

  /**
   * 是否已删除
   * @example true
   */
  isDeleted: boolean
}
