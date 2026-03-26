import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'
import type { IPage, BasePageRequest } from '@/modules/shared/domain/page'
import type { ApprovalInstance } from '@/modules/approval/domain/types'
import axios from 'axios'
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

interface OssPolicyResponse {
  accessId: string
  policy: string
  signature: string
  dir: string
  host: string
  expire: string
  callback: string
}

const SERVICE_AGREEMENT_ENDPOINTS = createPrefixedEndpoints('/service_agreement', {
  SIGN: '/sign',
  RECORD: '/record',
  DUPLICATE_CHECK: '/duplicate_check',
  GET: '/get',
  PAGE: '/page',
  PREVIEW_ATTACHMENTS: '/preview/attachments',
})

const FILE_UPLOAD_ENDPOINTS = createPrefixedEndpoints('/file', {
  POLICY: '/policy',
})

const getOssPolicy = (fileName: string) =>
  useRequest<OssPolicyResponse>({
    method: 'POST',
    url: FILE_UPLOAD_ENDPOINTS.POLICY,
    data: { fileName },
  })

const uploadToOss = async (
  policy: OssPolicyResponse,
  file: File,
  onProgress: (e: { percent: number }) => void,
) => {
  const formData = new FormData()
  const key = `${policy.dir}${file.name}`

  formData.append('key', key)
  formData.append('policy', policy.policy)
  formData.append('OSSAccessKeyId', policy.accessId)
  formData.append('signature', policy.signature)
  formData.append('callback', policy.callback)
  formData.append('success_action_status', '200')
  formData.append('file', file)

  const response = await axios.post<OssCallbackDTO>(policy.host, formData, {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress({ percent })
      }
    },
  })

  return response.data
}

export const serviceAgreementRepository = {
  uploadFile: (
    file: File,
    _fileCategory: FileCategory,
    onProgress: (e: { percent: number }) => void,
  ) =>
    getOssPolicy(file.name).then((policy) => {
      // TODO: callback 偶发失败时，可考虑基于 ossObjectKey/fileHash 增加补偿查询以回填业务 fileId。
      return uploadToOss(policy, file, onProgress)
    }),
  sign: (data: ServiceAgreementRequestDTO) => {
    return useRequest<ApprovalInstance<ServiceAgreementRequestDTO>>({
      method: 'POST',
      url: SERVICE_AGREEMENT_ENDPOINTS.SIGN,
      data,
    })
  },
  record: (data: ServiceAgreementRequestDTO) => {
    return useRequest<ServiceAgreementVo>({
      method: 'POST',
      url: SERVICE_AGREEMENT_ENDPOINTS.RECORD,
      data,
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
    })
  },
  get: (id: number) => {
    return useRequest<ServiceAgreementVo>({
      method: 'GET',
      url: SERVICE_AGREEMENT_ENDPOINTS.GET,
      params: { id },
    })
  },
  page: (pageRequest: BasePageRequest<ServiceAgreementPageDTO>) => {
    return useRequest<IPage<ServiceAgreementPageVo>>({
      method: 'POST',
      url: SERVICE_AGREEMENT_ENDPOINTS.PAGE,
      data: pageRequest,
    })
  },
  getPreviewAttachments: (data: ServiceAgreementPreviewAttachmentsDTO) => {
    return useRequest<PreviewAttachmentsVO>({
      method: 'POST',
      url: SERVICE_AGREEMENT_ENDPOINTS.PREVIEW_ATTACHMENTS,
      data,
    })
  },
}
