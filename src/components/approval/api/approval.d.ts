import type { BaseQuery, ConditionWrapper } from '@/types/request'

export declare interface ApprovalInstanceStatus {
  PENDING: 'pending'
  HANDLING: 'handling'
  APPROVED: 'approved'
  REJECTED: 'rejected'
  CANCELED: 'canceled'
}

export declare interface ApprovalTaskStatus {
  PENDING: 'pending'
  HANDLING: 'handling'
  APPROVED: 'approved'
  REJECTED: 'rejected'
  TRANSFER: 'transfer'
}

export declare interface ApprovalProcessName {
  SIGN: '备案/签约信息审批'
  USER: '用户信息审批'
}
export declare interface ApprovalInstance<T extends Record<unknown, unknown>> {
  /**
   * 主键ID
   */
  id: number

  /**
   * 审批流程ID
   * <p>
   * 关联approval_process表的ID
   * </p>
   */
  processId: number

  /**
   * 审批流程名称
   * <p>
   * 关联approval_process表的名称
   * </p>
   */
  processName: ApprovalProcessName[keyof ApprovalProcessName]

  /**
   * 对应业务表单的ID
   * <p>
   * 关联到具体业务表单的ID
   * </p>
   */
  formId: number

  /**
   * 当前审批节点ID
   * <p>
   * 关联approval_node表的ID，表示当前审批所处的节点
   * </p>
   */
  currentNodeId: number

  /**
   * 审批实例当前状态
   * <p>
   * 可选值：pending(待审批)、approved(已通过)、rejected(已拒绝)、canceled(已取消)
   * </p>
   */
  status: ApprovalInstanceStatus[keyof ApprovalInstanceStatus]

  /**
   * 提交审批申请人ID
   * <p>
   * 关联用户表的ID，表示发起审批的用户
   * </p>
   */
  applicantId: number

  /**
   * 待审批数据
   * <p>
   * 存储JSON格式的待审批数据
   * </p>
   */
  approvalData: T

  /**
   * 源数据
   * <p>
   * 存储JSON格式的原始数据
   * </p>
   */
  sourceData: T

  /**
   * 审批流程名称
   * 关联approval_process表的process_name
   */
  processName: ApprovalProcessName[keyof ApprovalProcessName]

  /**
   * 审批节点名称
   * 关联approval_node表的node_name
   */
  nodeName: string

  /**
   * 审批节点名称
   * 关联approval_node表的node_name
   */
  taskStatus: ApprovalTaskStatus[keyof ApprovalTaskStatus]

  /**
   * 提交审批申请人id
   */
  applicantId: number

  /**
   * 提交审批申请人名称
   */
  applicantName?: string

  /**
   * 对应处理人id
   */
  assigneeId: number

  /**
   * 对应处理人名称
   */
  assigneeName?: string

  /**
   * 审批所需角色id
   */
  candidateRoles: number[]
  /**
   * 审批所需地区代码
   */
  permissionValidator: string
  /**
   * 审批任务id
   */
  taskId: number
  /**
   * 创建时间
   */
  createdTime: string
}

/**
 * 审批意见请求体
 */
export interface ApprovalOpinionRequest {
  /**
   * 审批任务id
   * @required
   */
  taskId: number
  /**
   * 审批意见
   * @required
   */
  comment: string

  /**
   * 是否同意审批
   * @required
   */
  approved: boolean
}

/**
 * 审批实例分页查询请求传输体
 */
export interface ApprovalInstancesPageRequest extends BaseQuery {
  /**
   * 审批流程id
   * @required
   */
  processId?: ConditionWrapper<string>

  /**
   * 提审人id
   */
  applicantId?: ConditionWrapper<number>

  /**
   * 创建时间
   */
  createdTime?: ConditionWrapper<string>

  /**
   * 更新时间
   */
  updatedTime?: ConditionWrapper<string>

  /**
   * 审批实例当前状态
   * @allowableValues pending | approved | rejected | canceled
   */
  status?: ConditionWrapper<ApprovalInstanceStatus>
}

// 基础审批任务类型（对应 ApprovalTask）
export interface ApprovalTask {
  /**
   * 审批任务ID，主键，自增
   */
  id?: number

  /**
   * 对应审批实例ID，关联approval_instance表
   */
  instanceId: number

  /**
   * 对应审批节点ID
   */
  nodeId: number

  /**
   * 对应处理人ID
   */
  assigneeId?: number

  /**
   * 审批任务当前状态
   * 可选值: pending(待处理), handling(处理中), approved(已通过), rejected(已拒绝)
   * 默认值: pending
   */
  status: ApprovalTaskStatus[keyof ApprovalTaskStatus]

  /**
   * 审批任务创建时间
   * 格式: yyyy-MM-dd HH:mm:ss
   */
  createdTime: string

  /**
   * 审批任务完成时间
   * 格式: yyyy-MM-dd HH:mm:ss
   */
  completedTime: string
}

// 审批任务VO类型（对应 ApprovalTaskVO）
export interface ApprovalTaskVO extends ApprovalTask {
  /**
   * 审批流程名称
   * 关联approval_process表的process_name
   */
  processName: ApprovalProcessName[keyof ApprovalProcessName]

  /**
   * 提交审批申请人名称
   */
  applicantName?: string

  /**
   * 对应处理人名称
   */
  assigneeName?: string
}
/**
 * @description 审批操作历史实体类
 *
 * 该类型对应于数据库中的 approval_history 表，用于记录审批流程中的操作历史。
 * 每条记录关联到一个审批实例、一个审批任务和一个审批节点，并记录操作人、操作类型、审批意见等信息。
 */
export interface ApprovalHistory {
  /**
   * @description 审批历史ID，主键
   */
  id: number

  /**
   * @description 对应审批实例ID，关联 approval_instance 表
   */
  instanceId: number

  /**
   * @description 对应审批任务ID，关联 approval_task 表
   */
  taskId: number

  /**
   * @description 对应审批节点ID
   */
  nodeId: number

  /**
   * @description 审批人ID
   */
  operatorId: number

  /**
   * @description 审批人
   */
  operator: string

  /**
   * @description 节点名称
   */
  nodeName: string

  /**
   * @description 操作类型
   */
  action: 'submit' | 'approve' | 'reject' | 'transfer' | 'claim' | 'cancel'

  /**
   * @description 审批意见
   */
  comment: string

  /**
   * @description 创建时间
   * @format yyyy-MM-dd HH:mm:ss
   */
  createdTime: string
}

export type LatestAdditionalInfoInstance = {
  /**
   * @description 审批实例ID，主键
   */
  id: number
  /**
   * @description 审批实例状态
   */
  status: ApprovalInstanceStatus[keyof ApprovalInstanceStatus]
}
