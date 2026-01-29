import type {
  ElectricityConsumptionType,
  FileCategory,
  PriceCategory,
  PriceModel,
  PriceType,
  ServiceAgreementStatus,
} from './enums'
import type { OssCallbackDTO } from '@/modules/file/domain/types'

export interface ServiceAgreement {
  id: number
  companyName: string
  companyArea: string
  companyAddress: string
  industry: string | null
  status: ServiceAgreementStatus
  liaisonName: string
  liaisonPosition: string
  liaisonPhone: string
  yearUsableCharge: number
  isTimeOfUsePricingEnabled: boolean
  peakPercentage: number | null
  superPeakPercentage: number | null
  standardPercentage: number | null
  valleyPercentage: number | null
  comment: string | null
  priceModel: PriceModel | null
  priceType: PriceType | null
  priceCategory: PriceCategory | null
  fixedPrice: string | null
  fixedSpread: string | null
  revenueShareRatio: number | null
  expirationTime: string | null
  creator: number
  createdTime: string
  updatedTime: string
}

export interface ServicePointSpecification {
  id: number
  agreementId: number
  serviceAccount: string
  transformerCapacity: number
  electricityConsumptionType: ElectricityConsumptionType
  voltageClass: string
  createdTime: string
  updatedTime: string
}

export interface ServiceAgreementAttachmentsVO {
  billFiles: OssCallbackDTO[]
  supplementaryAttachmentFiles: OssCallbackDTO[]
  contractScanFiles: OssCallbackDTO[]
}

export interface ServiceAgreementVo extends ServiceAgreement {
  contractScanFiles: OssCallbackDTO[]
  billFiles: OssCallbackDTO[]
  supplementaryAttachmentFiles: OssCallbackDTO[]
  servicePointSpecifications: ServicePointSpecification[]
}

export interface ServiceAgreementPageVo {
  id: number
  companyName: string
  companyArea: string
  status: ServiceAgreementStatus
  yearUsableCharge: number
  expirationTime: string | null
}

export interface PreviewAttachmentsVO {
  newFiles: ServiceAgreementAttachmentsVO
  oldFiles: ServiceAgreementAttachmentsVO
}

export interface ServiceAgreementFileUploadResult {
  fileCategory: FileCategory
  file: OssCallbackDTO
}
