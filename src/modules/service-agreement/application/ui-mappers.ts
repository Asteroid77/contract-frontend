import type {
  AttachmentDataForUI,
  CustomerInfoDataForUI,
  ServiceAgreementUIMap,
  ServiceAgreementDetail,
  SignInfoDataForUI,
} from './models'
import type { ServiceAgreementStatus } from '../domain/enums'
import type { ServiceAgreementRequestDTO } from '../domain/dto'
import { mapItemIds, toDateTimeString, trimToNull } from '@/modules/shared/application/mapper-utils'

const DEFAULT_STATUS: ServiceAgreementStatus = 1

/**
 * 将后端 VO 转换为 UI 所需的 CustomerInfo
 */
export const createCustomerInfoModel = (
  origin: Partial<ServiceAgreementDetail> = {},
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
  origin: Partial<ServiceAgreementDetail> = {},
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
  origin: Partial<ServiceAgreementDetail> = {},
): AttachmentDataForUI => {
  return {
    contractScanIds: origin.contractScanIds ?? mapItemIds(origin.contractScanFiles),
    billIds: origin.billIds ?? mapItemIds(origin.billFiles),
    supplementaryAttachmentIds:
      origin.supplementaryAttachmentIds ?? mapItemIds(origin.supplementaryAttachmentFiles),
  }
}

/**
 * 主入口：将可能为空的后端 VO 转换为 UI 状态树
 */
export const createServiceAgreementModel = (
  origin?: Partial<ServiceAgreementDetail>,
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
export const convertUIToRequestDTO = (
  uiModel: ServiceAgreementUIMap,
): ServiceAgreementRequestDTO => {
  const { customerInfo, signInfo, attachmentInfo } = uiModel
  return {
    id: customerInfo.id,
    status: customerInfo.status,
    companyName: trimToNull(customerInfo.companyName) ?? '',
    companyArea: trimToNull(customerInfo.companyArea) ?? '',
    companyAddress: trimToNull(customerInfo.companyAddress) ?? '',
    industry: trimToNull(customerInfo.industry),
    liaisonName: trimToNull(customerInfo.liaisonName) ?? '',
    liaisonPosition: trimToNull(customerInfo.liaisonPosition) ?? '',
    liaisonPhone: trimToNull(customerInfo.liaisonPhone) ?? '',
    yearUsableCharge: customerInfo.yearUsableCharge || 0,
    isTimeOfUsePricingEnabled: customerInfo.isTimeOfUsePricingEnabled,
    peakPercentage: customerInfo.peakPercentage,
    superPeakPercentage: customerInfo.superPeakPercentage,
    standardPercentage: customerInfo.standardPercentage,
    valleyPercentage: customerInfo.valleyPercentage,
    comment: trimToNull(customerInfo.comment),
    priceModel: signInfo.priceModel,
    priceType: signInfo.priceType,
    priceCategory: signInfo.priceCategory,
    fixedPrice: signInfo.fixedPrice,
    fixedSpread: signInfo.fixedSpread,
    revenueShareRatio: signInfo.revenueShareRatio,
    expirationTime: toDateTimeString(signInfo.expirationTime),
    servicePointSpecifications: signInfo.servicePointSpecifications,
    contractScanIds: attachmentInfo.contractScanIds,
    billIds: attachmentInfo.billIds,
    supplementaryAttachmentIds: attachmentInfo.supplementaryAttachmentIds,
    creator: null,
  }
}
