import type { BasePageRequest, IPage, ServerResponse } from '@/types/request'
import { createPrefixedEndpoints } from '@/_utils/api/api-prefix-generator'
import type { OssCallbackDTO } from '@/components/file/api/file-storage'
import { useRequest } from '@/hooks/request/useRequest'
import type { ApprovalInstance } from '@/components/approval/api/approval'
import type {
  PreviewAttachmentsVO,
  ServiceAgreement,
  ServiceAgreementPageDTO,
  ServiceAgreementPageVo,
  ServiceAgreementPreviewAttachmentsDTO,
  ServiceAgreementRequestDTO,
  ServiceAgreementVo,
} from './sign'

export const SERVICEAGREEMENT_API_ENDPOINT = createPrefixedEndpoints('/service_agreement', {
  UPLOAD: '/upload',
  SIGN: '/sign',
  RECORD: '/record',
  DUPLICATE_CHECK: '/duplicate_check',
  GET: '/get',
  PAGE: '/page',
  PREVIEW_ATTACHMENTS: '/preview/attachments',
})

export const serviceAgreementApi = {
  /**
   * 文件上传接口
   * @param file 上传的文件
   * @param fileCategory 文件分类
   */
  uploadFile: (
    file: File,
    fileCategory: string,
    onProgress: (e: { percent: number }) => void,
  ): Promise<ServerResponse<OssCallbackDTO>> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileCategory', fileCategory)

    return useRequest<ServerResponse<OssCallbackDTO>, FormData>({
      method: 'POST',
      url: SERVICEAGREEMENT_API_ENDPOINT.UPLOAD,
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
    })
  },
  /**
   * 提交签约审批 (POST /sign)
   */
  sign: (data: ServiceAgreementRequestDTO) => {
    return useRequest<ServerResponse<ApprovalInstance<ServiceAgreementRequestDTO>>>({
      method: 'POST',
      url: SERVICEAGREEMENT_API_ENDPOINT.SIGN,
      data,
    })
  },
  /**
   * 保存备案 (POST /record)
   */
  record: (data: ServiceAgreementRequestDTO) => {
    return useRequest<ServerResponse<ServiceAgreementVo>>({
      method: 'POST',
      url: SERVICEAGREEMENT_API_ENDPOINT.RECORD,
      data,
    })
  },
  /**
   * 公司重名/区域校验 (POST /duplicate_check)
   * 后端定义：@RequestParam companyName, @RequestParam pca
   */
  duplicateCheck: (companyName: string, pca: string) => {
    return useRequest<ServerResponse<ServiceAgreement>>({
      method: 'POST',
      url: SERVICEAGREEMENT_API_ENDPOINT.DUPLICATE_CHECK,
      params: {
        companyName,
        pca,
      },
    })
  },
  /**
   * 获取备案/签约详情 (GET /get)
   * @param id 记录ID
   */
  get: (id: number) => {
    return useRequest<ServerResponse<ServiceAgreementVo>>({
      method: 'GET',
      url: SERVICEAGREEMENT_API_ENDPOINT.GET,
      params: { id },
    })
  },

  /**
   * 分页查询备案/签约列表 (POST /page)
   * @param pageRequest 分页请求参数
   */
  page: (pageRequest: BasePageRequest<ServiceAgreementPageDTO>) => {
    return useRequest<ServerResponse<IPage<ServiceAgreementPageVo>>>({
      method: 'POST',
      url: SERVICEAGREEMENT_API_ENDPOINT.PAGE,
      data: pageRequest,
    })
  },

  /**
   * 获取附件预览链接 (需校验手机号后四位)
   * POST /preview_attachments
   */
  getPreviewAttachments: (data: ServiceAgreementPreviewAttachmentsDTO) => {
    return useRequest<ServerResponse<PreviewAttachmentsVO>>({
      method: 'POST',
      url: SERVICEAGREEMENT_API_ENDPOINT.PREVIEW_ATTACHMENTS,
      data,
    })
  },
}
