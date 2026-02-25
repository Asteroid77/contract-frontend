import type { BasePageRequest, IPage } from '@/modules/shared/application/request/types'
import { toDomainPageRequest } from '@/modules/shared/application/query/legacy-query-adapter'
import type { QueryFilters } from '@/modules/shared/domain/query'
import type { BasePageRequest as DomainBasePageRequest } from '@/modules/shared/domain/page'
import { serviceAgreementRepository } from '../infrastructure/service-agreement-repository'
import {
  toViewPreviewAttachments,
  toViewServiceAgreement,
  toViewServiceAgreementPage,
} from './mappers'
import { sanitizeServiceAgreementRequest } from './cleaners'
import type {
  ServiceAgreementPageItem,
  ServiceAgreementPageQuery,
  PreviewAttachmentsQuery,
  PreviewAttachmentsData,
} from './models'
import type { FileCategory } from '../domain/enums'
import { toOssCallbackView } from '@/modules/file/application/models'
import type { ApprovalInstance } from '@/modules/approval/domain/types'
import type { ServiceAgreementRequestDTO as DomainServiceAgreementRequestDTO } from '../domain/dto'

type ServiceAgreementPageFilterQuery = ServiceAgreementPageQuery | QueryFilters

type ServiceAgreementPageRequest = Omit<BasePageRequest<ServiceAgreementPageQuery>, 'query'> & {
  query?: ServiceAgreementPageFilterQuery
}

const isQueryFilters = (query: unknown): query is QueryFilters => {
  if (!query || typeof query !== 'object') return false
  return 'filters' in query || 'group' in query
}

const normalizeSize = (size?: ServiceAgreementPageRequest['size']) => {
  if (size == null) return undefined
  if (typeof size === 'number') return size
  if (typeof size === 'string') {
    const parsed = Number(size)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

const toDomainPageRequestSmart = (
  pageRequest: ServiceAgreementPageRequest,
): DomainBasePageRequest<QueryFilters> => {
  if (isQueryFilters(pageRequest.query)) {
    return {
      page: pageRequest.page,
      size: normalizeSize(pageRequest.size),
      orders: pageRequest.orders?.map((item) => ({
        column: item.column,
        direction: item.direction ?? 'ASC',
      })),
      query: pageRequest.query,
    }
  }

  return toDomainPageRequest(pageRequest as BasePageRequest<ServiceAgreementPageQuery>)
}

const toViewApprovalInstance = (
  instance: ApprovalInstance<DomainServiceAgreementRequestDTO>,
): ApprovalInstance<DomainServiceAgreementRequestDTO> => ({
  ...instance,
  approvalData: instance.approvalData, // Assuming no conversion needed for DTO to DTO if they are same type
  sourceData: instance.sourceData,
})

// REVISIT: The mapping logic here seems to rely on toViewServiceAgreementRequest which used to return models.ServiceAgreementRequestDTO.
// But now we want to use DomainServiceAgreementRequestDTO everywhere for data transmission?
// Or do we have a VIEW version of RequestDTO?
// Let's stick to Domain DTO for now as simple pass-through if cleaner is not changing type.
// Actually, let's keep the cleaner but fix types.

export const serviceAgreementService = {
  uploadFile: (
    file: File,
    fileCategory: FileCategory,
    onProgress: (e: { percent: number }) => void,
  ) =>
    serviceAgreementRepository.uploadFile(file, fileCategory, onProgress).then(toOssCallbackView),
  sign: (data: DomainServiceAgreementRequestDTO) =>
    serviceAgreementRepository
      .sign(sanitizeServiceAgreementRequest(data))
      .then(toViewApprovalInstance),
  record: (data: DomainServiceAgreementRequestDTO) =>
    serviceAgreementRepository
      .record(sanitizeServiceAgreementRequest(data))
      .then(toViewServiceAgreement),
  duplicateCheck: (companyName: string, pca: string) =>
    serviceAgreementRepository.duplicateCheck(companyName, pca),
  get: (id: number) => serviceAgreementRepository.get(id).then(toViewServiceAgreement),
  page: (pageRequest: ServiceAgreementPageRequest): Promise<IPage<ServiceAgreementPageItem>> =>
    serviceAgreementRepository.page(toDomainPageRequestSmart(pageRequest)).then((page) => ({
      ...page,
      records: page.records.map(toViewServiceAgreementPage),
    })),
  getPreviewAttachments: (data: PreviewAttachmentsQuery): Promise<PreviewAttachmentsData> =>
    serviceAgreementRepository.getPreviewAttachments(data).then(toViewPreviewAttachments),
}
