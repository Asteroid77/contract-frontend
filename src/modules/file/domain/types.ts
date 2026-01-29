import type { FileSourceType, FileStatus } from './enums'

export interface FileStorage {
  id: number
  fileName: string
  fileType: string
  sourceType: FileSourceType
  ossRegion: string
  ossBucket: string
  ossObjectKey: string
  fileSize: number
  fileHash: string
  uploadTime: string
  uploader: number
  description: string | null
  status: FileStatus
}

export interface OssCallbackDTO extends FileStorage {
  path: string
  expireTime: number
}

export interface FileResponse {
  id: number
  fileName: string
  fileType: string
  fileSize: number
  fileHash: string
  sourceType: FileSourceType
  ossRegion: string
  ossBucket: string
  ossObjectKey: string
  accessUrl: string
  expireTime: number
  uploader: number
  uploadTime: string
  status: FileStatus
  description: string | null
}

export interface FileUploadResponse {
  id: number
  fileName: string
  accessUrl: string
  expireTime: number
}
