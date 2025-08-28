export declare interface ApprovalInstanceStatus {
  PENDING: 'pending'
  HANDLING: 'handling'
  APPROVED: 'approved'
  REJECTED: 'rejected'
  CANCELED: 'canceled'
}
export declare interface ApprovalIsntance<T extends Record<unknown, unknown>> {
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
}
