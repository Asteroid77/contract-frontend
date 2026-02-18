export const WorkOrderStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const

export type WorkOrderStatus = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus]

export const WorkOrderUserType = {
  USER: 'USER',
  HANDLER: 'HANDLER',
} as const

export type WorkOrderUserType = (typeof WorkOrderUserType)[keyof typeof WorkOrderUserType]
