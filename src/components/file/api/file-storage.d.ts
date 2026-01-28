/**
 * 文件来源类型枚举
 * @description 对应 Java 中的 FileSourceType 枚举
 */
export type FileSourceType = 'aliyun_oss' | 'local' | 'qiniu'

/**
 * 文件状态枚举
 * @description 对应 Java 中的 FileStatus 枚举
 */
export type FileStatus = 'TEMP' | 'CONFIRMED'

/**
 * 文件存储信息
 * @description 对应 Java 中的 FileStorage 类
 */
export interface FileStorage {
  /**
   * 主键，自增ID
   * @type {number} (Java Long)
   */
  id: number

  /**
   * 文件名
   * @example "cat.jpg"
   */
  fileName: string

  /**
   * 文件类型（如 jpg、png、pdf）
   * @example "jpg"
   */
  fileType: string

  /**
   * 数据源分类
   */
  sourceType: FileSourceType

  /**
   * OSS地区
   * @example "oss-cn-hangzhou"
   */
  ossRegion: string

  /**
   * OSS桶名
   * @example "my-bucket"
   */
  ossBucket: string

  /**
   * OSS对象路径
   * @example "images/2024/07/23/abc123.jpg"
   */
  ossObjectKey: string

  /**
   * 文件大小（字节）
   * @type {number} (Java Long)
   * @example 204800
   */
  fileSize: number

  /**
   * 上传时间 (ISO 8601 格式字符串)
   * @type {string} (Java LocalDateTime)
   * @example "2024-07-23T15:30:00"
   */
  uploadTime: string

  /**
   * 上传者ID
   * @type {number} (Java Long)
   * @example 123
   */
  uploader: number

  /**
   * 备注或描述
   * @example "近三月电费单"
   */
  description: string | null

  /**
   * 文件状态
   */
  status: FileStatus
}
/**
 * OSS上传后回传信息
 * @description 对应 Java 中的 OssCallbackDTO 类
 */
export interface OssCallbackDTO extends FileStorage {
  /**
   * 回传访问路径
   */
  accessUrl: string

  /**
   * 过期时间 (时间戳)
   * @type {number} (Java long)
   */
  expireTime: number
}

// 导出 code 的类型，用于 props 定义
export type FileCategoryCode = (typeof FileCategory)[keyof typeof FileCategory]
