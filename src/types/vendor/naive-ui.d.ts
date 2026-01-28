import type { OssCallbackDTO } from '@/components/file/api/file-storage'
import type { UploadFileInfo } from 'naive-ui'

export interface AgreementUploadFileInfo extends UploadFileInfo {
  meta?: OssCallbackDTO
}
export type ValidateError = {
  field: string
  fieldValue: unknown
  message: string
}
