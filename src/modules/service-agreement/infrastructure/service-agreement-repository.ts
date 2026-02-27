import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'
import type { IPage, BasePageRequest } from '@/modules/shared/domain/page'
import type { ApprovalInstance } from '@/modules/approval/domain/types'
import type {
  ServiceAgreementPageDTO,
  ServiceAgreementPreviewAttachmentsDTO,
  ServiceAgreementRequestDTO,
} from '../domain/dto'
import type {
  PreviewAttachmentsVO,
  ServiceAgreementPageVo,
  ServiceAgreementVo,
} from '../domain/types'
import type { FileCategory } from '../domain/enums'
import type { OssCallbackDTO } from '@/modules/file/domain/types'

const SERVICE_AGREEMENT_ENDPOINTS = createPrefixedEndpoints('/service_agreement', {
  UPLOAD: '/upload',
  SIGN: '/sign',
  RECORD: '/record',
  DUPLICATE_CHECK: '/duplicate_check',
  GET: '/get',
  PAGE: '/page',
  PREVIEW_ATTACHMENTS: '/preview/attachments',
})

export const serviceAgreementRepository = {
  uploadFile: (
    file: File,
    fileCategory: FileCategory,
    onProgress: (e: { percent: number }) => void,
  ) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileCategory', fileCategory)

    return useRequest<OssCallbackDTO, FormData>({
      method: 'POST',
      url: SERVICE_AGREEMENT_ENDPOINTS.UPLOAD,
      data: formData,
      headers: {
        'Content-Type': undefined,
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress({ percent })
        }
      },
      responseShape: 'data',
    })
  },
  sign: (data: ServiceAgreementRequestDTO) => {
    return useRequest<ApprovalInstance<ServiceAgreementRequestDTO>>({
      method: 'POST',
      url: SERVICE_AGREEMENT_ENDPOINTS.SIGN,
      data,
      responseShape: 'data',
    })
  },
  record: (data: ServiceAgreementRequestDTO) => {
    return useRequest<ServiceAgreementVo>({
      method: 'POST',
      url: SERVICE_AGREEMENT_ENDPOINTS.RECORD,
      data,
      responseShape: 'data',
    })
  },
  duplicateCheck: (companyName: string, pca: string) => {
    return useRequest<boolean>({
      method: 'POST',
      url: SERVICE_AGREEMENT_ENDPOINTS.DUPLICATE_CHECK,
      params: {
        companyName,
        pca,
      },
      responseShape: 'data',
    })
  },
  get: (id: number) => {
    return useRequest<ServiceAgreementVo>({
      method: 'GET',
      url: SERVICE_AGREEMENT_ENDPOINTS.GET,
      params: { id },
      responseShape: 'data',
    })
  },
  page: (pageRequest: BasePageRequest<ServiceAgreementPageDTO>) => {
    return useRequest<IPage<ServiceAgreementPageVo>>({
      method: 'POST',
      url: SERVICE_AGREEMENT_ENDPOINTS.PAGE,
      data: pageRequest,
      responseShape: 'data',
    })
  },
  getPreviewAttachments: (data: ServiceAgreementPreviewAttachmentsDTO) => {
    return useRequest<PreviewAttachmentsVO>({
      method: 'POST',
      url: SERVICE_AGREEMENT_ENDPOINTS.PREVIEW_ATTACHMENTS,
      data,
      responseShape: 'data',
    })
  },
}
