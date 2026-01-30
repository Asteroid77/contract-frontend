import type {
  AttachmentDataForUI,
  CustomerInfoDataForUI,
  ServiceAgreementRequestDTO,
  ServiceAgreementUIMap,
  ServiceAgreementVo,
  SignInfoDataForUI,
} from './models'
import type { OssCallbackDTO } from '@/modules/file/application/models'
import type { ServiceAgreementStatus } from '../domain/enums'

const DEFAULT_STATUS: ServiceAgreementStatus = 1

/**
 * 将后端 VO 转换为 UI 所需的 CustomerInfo
 */
export const createCustomerInfoModel = (
  origin: Partial<ServiceAgreementVo> = {},
): CustomerInfoDataForUI => {
  return {
    id: origin.id ?? null,
    status: origin.status ?? DEFAULT_STATUS,
    companyName: origin.companyName ?? '',
    companyArea: origin.companyArea ?? '',
    companyAddress: origin.companyAddress ?? '',
    industry: origin.industry ?? null,
    liaisonName: origin.liaisonName ?? '',
    liaisonPosition: origin.liaisonPosition ?? '',
    liaisonPhone: origin.liaisonPhone ?? '',
    yearUsableCharge: origin.yearUsableCharge ?? 0,
    isTimeOfUsePricingEnabled: origin.isTimeOfUsePricingEnabled ?? false,
    peakPercentage: origin.peakPercentage ?? null,
    superPeakPercentage: origin.superPeakPercentage ?? null,
    standardPercentage: origin.standardPercentage ?? null,
    valleyPercentage: origin.valleyPercentage ?? null,
    comment: origin.comment ?? '',
  }
}

/**
 * 将后端 VO 转换为 UI 所需的 SignInfo
 */
export const createSignInfoModel = (
  origin: Partial<ServiceAgreementVo> = {},
): SignInfoDataForUI => {
  return {
    priceModel: origin.priceModel ?? null,
    priceType: origin.priceType ?? null,
    priceCategory: origin.priceCategory ?? null,
    fixedPrice: origin.fixedPrice ?? null,
    fixedSpread: origin.fixedSpread ?? null,
    revenueShareRatio: origin.revenueShareRatio ?? null,
    expirationTime: origin.expirationTime ? new Date(origin.expirationTime).getTime() : null,
    comment: null,
    servicePointSpecifications: Array.isArray(origin.servicePointSpecifications)
      ? origin.servicePointSpecifications
      : [],
  }
}

/**
 * 将后端 VO (含文件对象列表) 转换为 UI 提交所需的 (ID 列表)
 */
export const createAttachmentInfoModel = (
  origin: Partial<ServiceAgreementVo> = {},
): AttachmentDataForUI => {
  const mapIds = (files?: OssCallbackDTO[]): number[] => {
    if (!Array.isArray(files)) return []
    return files.map((f) => f.id)
  }

  return {
    contractScanIds: origin.contractScanIds || mapIds(origin.contractScanFiles),
    billIds: origin.billIds || mapIds(origin.billFiles),
    supplementaryAttachmentIds:
      origin.supplementaryAttachmentIds || mapIds(origin.supplementaryAttachmentFiles),
  }
}

/**
 * 主入口：将可能为空的后端 VO 转换为 UI 状态树
 */
export const createServiceAgreementModel = (
  origin?: Partial<ServiceAgreementVo>,
): ServiceAgreementUIMap => {
  const safeOrigin = origin || {}

  return {
    customerInfo: createCustomerInfoModel(safeOrigin),
    signInfo: createSignInfoModel(safeOrigin),
    attachmentInfo: createAttachmentInfoModel(safeOrigin),
  }
}

/**
 * 将 UI 状态树转换为后端所需的 DTO
 */
const trimOrNull = (val: string | null | undefined): string | null => {
  if (val === null || val === undefined) return null
  const trimmed = val.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * 将 UI 状态树转换为后端所需的 DTO
 */
export const convertUIToRequestDTO = (
  uiModel: ServiceAgreementUIMap,
): ServiceAgreementRequestDTO => {
  const { customerInfo, signInfo, attachmentInfo } = uiModel
  return {
    id: customerInfo.id,
    status: customerInfo.status,
    companyName: trimOrNull(customerInfo.companyName),
    companyArea: trimOrNull(customerInfo.companyArea),
    companyAddress: trimOrNull(customerInfo.companyAddress),
    industry: trimOrNull(customerInfo.industry),
    liaisonName: trimOrNull(customerInfo.liaisonName),
    liaisonPosition: trimOrNull(customerInfo.liaisonPosition),
    liaisonPhone: trimOrNull(customerInfo.liaisonPhone),
    yearUsableCharge: customerInfo.yearUsableCharge || 0,
    isTimeOfUsePricingEnabled: customerInfo.isTimeOfUsePricingEnabled,
    peakPercentage: customerInfo.peakPercentage,
    superPeakPercentage: customerInfo.superPeakPercentage,
    standardPercentage: customerInfo.standardPercentage,
    valleyPercentage: customerInfo.valleyPercentage,
    comment: trimOrNull(customerInfo.comment),
    priceModel: signInfo.priceModel,
    priceType: signInfo.priceType,
    priceCategory: signInfo.priceCategory,
    fixedPrice: signInfo.fixedPrice,
    fixedSpread: signInfo.fixedSpread,
    revenueShareRatio: signInfo.revenueShareRatio,
    expirationTime: signInfo.expirationTime,
    servicePointSpecifications: signInfo.servicePointSpecifications,
    contractScanIds: attachmentInfo.contractScanIds,
    billIds: attachmentInfo.billIds,
    supplementaryAttachmentIds: attachmentInfo.supplementaryAttachmentIds,
  }
}
