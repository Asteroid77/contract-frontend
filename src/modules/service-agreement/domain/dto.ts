import type { QueryFilters } from '@/modules/shared/domain/query'
import type {
  ElectricityConsumptionType,
  FileCategory,
  PriceCategory,
  PriceModel,
  PriceType,
  PreviewType,
  ServiceAgreementStatus,
} from './enums'

export type ServiceAgreementPageDTO = QueryFilters

export interface ServiceAgreementPreviewAttachmentsDTO {
  code: string
  id: number
  type: PreviewType
}

export interface ServicePointSpecificationInput {
  id?: number
  agreementId?: number
  serviceAccount: string
  transformerCapacity: number
  electricityConsumptionType: ElectricityConsumptionType
  voltageClass: string
}

export interface ServiceAgreementRequestDTO {
  id: number | null
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
  contractScanIds: number[] | null
  billIds: number[] | null
  supplementaryAttachmentIds: number[] | null
  servicePointSpecifications: ServicePointSpecificationInput[] | null
  creator: number | null
}

export interface ServiceAgreementFileUploadDTO {
  file: File
  fileCategory: FileCategory
}
