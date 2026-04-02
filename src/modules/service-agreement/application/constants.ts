import { $t } from '@/_utils/i18n'
import type { PriceModel } from '@/modules/service-agreement/application/models'
import type { SelectOption } from 'naive-ui'
import type { Ref } from 'vue'

export const FileUploadStatus = {
  Pending: 'pending',
  Uploading: 'uploading',
  Finished: 'finished',
  Removed: 'removed',
  Error: 'error',
} as const
export const PriceTypeEnum = {
  PowerPlantSide: 1,
  UserSide: 2,
  SalesCompanySide: 3,
} as const

export const PriceModelEnum = {
  RevenueShare: 1,
  Guaranteed: 2,
  GuaranteedAndShare: 3,
  Other: 4,
} as const

export const PriceCategoryEnum = {
  FixedPrice: 1,
  FixedSpread: 2,
  ShareRatio: 3,
} as const
export const UsageCategoryEnum = {
  LargeIndustrial: 1,
  CommercialAndIndustrial: 2,
}

export const ServiceAgreementStatusEnum = {
  Record: 1,
  Sign: 2,
  Invalid: 3,
} as const

export const ServiceAgreementStatusOption = [
  { label: $t('domain.agreement.status.filing'), value: 1 },
  { label: $t('domain.agreement.status.signing'), value: 2 },
  { label: $t('domain.agreement.status.invalid'), value: 3, disabled: true },
]

export const PriceModelOption = [
  {
    label: $t('domain.agreement.option.revenueShare'),
    value: PriceModelEnum.RevenueShare,
  },
  {
    label: $t('domain.agreement.option.guaranteed'),
    value: PriceModelEnum.Guaranteed,
  },
  {
    label: $t('domain.agreement.option.guaranteedShare'),
    value: PriceModelEnum.GuaranteedAndShare,
  },
  {
    label: $t('domain.agreement.option.other'),
    value: PriceModelEnum.Other,
  },
]
export const PriceTypeOption = (priceModel: Ref<PriceModel | null>) => [
  {
    label: $t('domain.agreement.option.powerPlant'),
    value: PriceTypeEnum.PowerPlantSide,
  },
  {
    label: $t('domain.agreement.option.userSide'),
    value: PriceTypeEnum.UserSide,
  },
  {
    label: $t('domain.agreement.option.salesSide'),
    value: PriceTypeEnum.SalesCompanySide,
    disabled: priceModel.value !== PriceModelEnum.Guaranteed,
  },
]
export const PriceCategoryOption = (priceModel: Ref<PriceModel | null>) => [
  {
    label: $t('domain.agreement.option.fixedPrice'),
    value: PriceCategoryEnum.FixedPrice,
    disabled: priceModel.value === PriceModelEnum.RevenueShare,
  },
  {
    label: $t('domain.agreement.option.fixedSpread'),
    value: PriceCategoryEnum.FixedSpread,
    disabled: priceModel.value === PriceModelEnum.RevenueShare,
  },
  {
    label: $t('domain.agreement.option.shareRatio'),
    value: PriceCategoryEnum.ShareRatio,
    disabled: priceModel.value !== PriceModelEnum.RevenueShare,
  },
]
export const UsageCategoryOption = [
  {
    label: $t('domain.servicePoint.option.largeInd'),
    value: UsageCategoryEnum.LargeIndustrial,
  },
  {
    label: $t('domain.servicePoint.option.commInd'),
    value: UsageCategoryEnum.CommercialAndIndustrial,
  },
]
export const TransformerCapacityOption = [
  { label: '30 kVA', value: 30 },
  { label: '50 kVA', value: 50 },
  { label: '63 kVA', value: 63 },
  { label: '80 kVA', value: 80 },
  { label: '100 kVA', value: 100 },
  { label: '125 kVA', value: 125 },
  { label: '160 kVA', value: 160 },
  { label: '200 kVA', value: 200 },
  { label: '250 kVA', value: 250 },
  { label: '315 kVA', value: 315 },
  { label: '400 kVA', value: 400 },
  { label: '500 kVA', value: 500 },
  { label: '630 kVA', value: 630 },
  { label: '800 kVA', value: 800 },
  { label: '1000 kVA', value: 1000 },
  { label: '1250 kVA', value: 1250 },
  { label: '1600 kVA', value: 1600 },
  { label: '2000 kVA', value: 2000 },
  { label: '2500 kVA', value: 2500 },
] as SelectOption[]
export const VoltageLevelOptions = [
  { label: '0.4 kV', value: 0.4 },
  { label: '10 kV', value: 10 },
  { label: '20 kV', value: 20 },
  { label: '35 kV', value: 35 },
  { label: '66 kV', value: 66 },
  { label: '110 kV', value: 110 },
  { label: '220 kV', value: 220 },
  { label: '330 kV', value: 330 },
  { label: '500 kV', value: 500 },
  { label: '750 kV', value: 750 },
  { label: '1000 kV', value: 1000 },
]
export const FileCategoryEnum = {
  BILL: 'BILL',
  CONTRACT: 'CONTRACT',
  ATTACHMENT: 'ATTACHMENT',
} as const
export const PreviewTypeEnum = {
  FORM_VIEW: 1,
  APPROVAL_VIEW: 2,
}
