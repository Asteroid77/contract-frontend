import type { BasePageRequest, IPage } from '@/modules/shared/application/request/types'
import { toDomainPageRequest } from '@/modules/shared/application/query/legacy-query-adapter'
import { serviceAgreementRepository } from '../infrastructure/service-agreement-repository'
import {
  toDomainServiceAgreementRequest,
  toViewPreviewAttachments,
  toViewServiceAgreement,
  toViewServiceAgreementPage,
  toViewServiceAgreementRequest,
} from './mappers'
import { sanitizeServiceAgreementRequest } from './cleaners'
import type {
  PreviewAttachmentsVO,
  ServiceAgreementPageDTO,
  ServiceAgreementPageVo,
  ServiceAgreementPreviewAttachmentsDTO,
  ServiceAgreementRequestDTO,
  ServiceAgreementVo,
} from './models'
import type { FileCategory } from '../domain/enums'
import { toOssCallbackView } from '@/modules/file/application/models'
import type { ApprovalInstance } from '@/modules/approval/domain/types'
import type { ServiceAgreementRequestDTO as DomainServiceAgreementRequestDTO } from '../domain/dto'

const toViewApprovalInstance = (
  instance: ApprovalInstance<DomainServiceAgreementRequestDTO>,
): ApprovalInstance<ServiceAgreementRequestDTO> => ({
  ...instance,
  approvalData: toViewServiceAgreementRequest(instance.approvalData),
  sourceData: instance.sourceData ? toViewServiceAgreementRequest(instance.sourceData) : null,
})

export const serviceAgreementService = {
  uploadFile: (
    file: File,
    fileCategory: FileCategory,
    onProgress: (e: { percent: number }) => void,
  ) => serviceAgreementRepository.uploadFile(file, fileCategory, onProgress).then(toOssCallbackView),
  sign: (data: ServiceAgreementRequestDTO) =>
    serviceAgreementRepository
      .sign(sanitizeServiceAgreementRequest(toDomainServiceAgreementRequest(data)))
      .then(toViewApprovalInstance),
  record: (data: ServiceAgreementRequestDTO) =>
    serviceAgreementRepository
      .record(sanitizeServiceAgreementRequest(toDomainServiceAgreementRequest(data)))
      .then(toViewServiceAgreement),
  duplicateCheck: (companyName: string, pca: string) =>
    serviceAgreementRepository.duplicateCheck(companyName, pca),
  get: (id: number) => serviceAgreementRepository.get(id).then(toViewServiceAgreement),
  page: (pageRequest: BasePageRequest<ServiceAgreementPageDTO>): Promise<IPage<ServiceAgreementPageVo>> =>
    serviceAgreementRepository
      .page(toDomainPageRequest(pageRequest))
      .then((page) => ({
        ...page,
        records: page.records.map(toViewServiceAgreementPage),
      })),
  getPreviewAttachments: (data: ServiceAgreementPreviewAttachmentsDTO): Promise<PreviewAttachmentsVO> =>
    serviceAgreementRepository.getPreviewAttachments(data).then(toViewPreviewAttachments),
}
