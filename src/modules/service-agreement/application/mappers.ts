import dayjs from 'dayjs'
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

// ... (toTimestamp, toDateTimeString, normalizeCompanyArea are unchanged? No, mapAttachments uses rename)

const toTimestamp = (value: string | null | undefined): number | null => {
  if (!value) return null
  const date = new Date(value)
  const time = date.getTime()
  return Number.isNaN(time) ? null : time
}

const toDateTimeString = (value: number | null | undefined): string | null => {
  if (value == null) return null
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
}

const normalizeCompanyArea = (value: string | null | undefined): string => {
  if (!value) return ''
  if (value.includes('/')) {
    const parts = value.split('/')
    return parts[parts.length - 1] || ''
  }
  return value
}

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
    companyArea: normalizeCompanyArea(domain.companyArea),
    expirationTime: toTimestamp(domain.expirationTime),
    createdTime: toTimestamp(domain.createdTime) ?? 0,
    updatedTime: toTimestamp(domain.updatedTime) ?? 0,
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
    companyArea: normalizeCompanyArea(domain.companyArea),
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
    companyArea: normalizeCompanyArea(view.companyArea),
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
    companyArea: normalizeCompanyArea(domain.companyArea),
    expirationTime: toTimestamp(domain.expirationTime),
    servicePointSpecifications: servicePointSpecifications
      ? servicePointSpecifications.map(toViewServicePoint)
      : null,
  }
}
