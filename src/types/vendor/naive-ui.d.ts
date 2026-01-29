import type { OssCallbackDTO } from '@/modules/file/application/models'
import type { UploadFileInfo } from 'naive-ui'

export interface AgreementUploadFileInfo extends UploadFileInfo {
  meta?: OssCallbackDTO
}
export type ValidateError = {
  field: string
  fieldValue: unknown
  message: string
}
