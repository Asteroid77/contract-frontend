import type {
  PreviewAttachmentsVO as DomainPreviewAttachmentsVO,
  ServiceAgreementPageVo as DomainServiceAgreementPageVo,
  ServiceAgreementVo as DomainServiceAgreementVo,
  ServiceAgreementAttachmentsVO as DomainServiceAgreementAttachmentsVO,
} from '../domain/types'
import type {
  ServiceAgreementRequestDTO as DomainServiceAgreementRequestDTO,
  ServicePointSpecificationInput,
} from '../domain/dto'
import type {
  PreviewAttachmentsData as ViewPreviewAttachmentsData,
  ServiceAgreementPageItem as ViewServiceAgreementPageItem,
  ServiceAgreementAttachmentsData as ViewServiceAgreementAttachmentsData,
  ServiceAgreementForm,
  ServiceAgreementDetail as ViewServiceAgreementDetail,
  ServicePointSpecification,
} from './models'
import { toOssCallbackView } from '@/modules/file/application/models'
import {
  getPathTail,
  toDateTimeString,
  toTimestampOrNull,
} from '@/modules/shared/application/mapper-utils'

const mapAttachments = (
  attachments: DomainServiceAgreementAttachmentsVO,
): ViewServiceAgreementAttachmentsData => {
  return {
    billFiles: attachments.billFiles.map(toOssCallbackView),
    supplementaryAttachmentFiles: attachments.supplementaryAttachmentFiles.map(toOssCallbackView),
    contractScanFiles: attachments.contractScanFiles.map(toOssCallbackView),
  }
}

export const toViewServiceAgreement = (
  domain: DomainServiceAgreementVo,
): ViewServiceAgreementDetail => {
  return {
    ...domain,
    companyArea: getPathTail(domain.companyArea),
    expirationTime: toTimestampOrNull(domain.expirationTime),
    createdTime: toTimestampOrNull(domain.createdTime) ?? 0,
    updatedTime: toTimestampOrNull(domain.updatedTime) ?? 0,
    contractScanFiles: domain.contractScanFiles.map(toOssCallbackView),
    billFiles: domain.billFiles.map(toOssCallbackView),
    supplementaryAttachmentFiles: domain.supplementaryAttachmentFiles.map(toOssCallbackView),
  }
}

export const toViewServiceAgreementPage = (
  domain: DomainServiceAgreementPageVo,
): ViewServiceAgreementPageItem => {
  return {
    ...domain,
    companyArea: getPathTail(domain.companyArea),
  }
}

export const toViewPreviewAttachments = (
  domain: DomainPreviewAttachmentsVO,
): ViewPreviewAttachmentsData => {
  return {
    newFiles: mapAttachments(domain.newFiles),
    oldFiles: mapAttachments(domain.oldFiles),
  }
}

const toServicePointInput = (item: ServicePointSpecification) => ({
  id: item.id,
  agreementId: item.agreementId,
  serviceAccount: item.serviceAccount,
  transformerCapacity: item.transformerCapacity,
  electricityConsumptionType: item.electricityConsumptionType,
  voltageClass: item.voltageClass,
})

const toViewServicePoint = (item: ServicePointSpecificationInput): ServicePointSpecification => ({
  id: item.id ?? 0,
  agreementId: item.agreementId ?? 0,
  serviceAccount: item.serviceAccount,
  transformerCapacity: item.transformerCapacity,
  electricityConsumptionType: item.electricityConsumptionType,
  voltageClass: item.voltageClass,
})

export const toDomainServiceAgreementRequest = (
  view: ServiceAgreementForm,
): DomainServiceAgreementRequestDTO => {
  return {
    ...view,
    companyName: view.companyName || '',
    companyAddress: view.companyAddress || '',
    liaisonName: view.liaisonName || '',
    liaisonPosition: view.liaisonPosition || '',
    liaisonPhone: view.liaisonPhone || '',
    industry: view.industry || null, // If DTO industry is string | null, this is fine. If string, use || ''
    comment: view.comment || null,
    companyArea: getPathTail(view.companyArea),
    expirationTime: toDateTimeString(view.expirationTime),
    servicePointSpecifications: view.servicePointSpecifications
      ? view.servicePointSpecifications.map(toServicePointInput)
      : null,
    creator: null,
  }
}

export const toViewServiceAgreementRequest = (
  domain: DomainServiceAgreementRequestDTO,
): ServiceAgreementForm => {
  const { servicePointSpecifications, ...rest } = domain
  return {
    ...rest,
    companyArea: getPathTail(domain.companyArea),
    expirationTime: toTimestampOrNull(domain.expirationTime),
    servicePointSpecifications: servicePointSpecifications
      ? servicePointSpecifications.map(toViewServicePoint)
      : null,
  }
}
