/**
 * 字段类型枚举
 */
export type FieldType = 'text' | 'number' | 'date' | 'money' | 'list' | 'file' | 'image'

/**
 * 基础字段定义
 */
export interface FieldDefinition {
  key: string
  label: string
  type?: FieldType
  /** 列表字段的子字段定义 */
  children?: FieldDefinition[]
}

/**
 * 文件状态枚举
 */
export type FileStatus = 'pending' | 'uploaded' | 'failed' | 'deleted'

/**
 * 文件来源类型
 */
export type FileSourceType = 'user_upload' | 'system_generated' | 'imported'

/**
 * 文件存储信息
 */
export interface FileStorage {
  id: number
  fileName: string
  fileType: string
  sourceType: FileSourceType
  ossRegion: string
  ossBucket: string
  ossObjectKey: string
  fileSize: number
  uploadTime: string
  uploader: number
  description: string | null
  status: FileStatus
}

/**
 * 文件视图模型（对齐项目A：FileResponse / OssCallbackView）
 * - 必备字段：id/fileName/fileType/fileSize/ossObjectKey/accessUrl
 * - 其余字段可由业务方扩展（TS 结构类型允许额外字段）
 */
export interface OssCallbackView {
  id: number
  fileName: string
  fileType: string
  fileSize: number
  ossObjectKey: string
  accessUrl: string
  expireTime?: number
  fileHash?: string
  sourceType?: unknown
  ossRegion?: string
  ossBucket?: string
  uploadTime?: string
  uploader?: number
  status?: unknown
  description?: string | null
}

/**
 * 字段值类型
 */
export type FieldValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ListItemValue[]
  | OssCallbackView
  | OssCallbackView[]

/**
 * 列表项的值
 */
export interface ListItemValue {
  id: string | number
  [key: string]: FieldValue
}

/**
 * 表单数据结构
 */
export interface FormData {
  [key: string]: FieldValue
}
