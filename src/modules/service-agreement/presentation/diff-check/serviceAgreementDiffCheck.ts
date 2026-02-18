import { $t } from '@/_utils/i18n'
import dayjs from 'dayjs'

import type { OssCallbackView as FileView } from '@/modules/file/application/models'
import type { ServiceAgreementDetail, ServicePointSpecification } from '@/modules/service-agreement/application/models'
import type { ServiceAgreementRequestDTO, ServicePointSpecificationInput } from '@/modules/service-agreement/domain/dto'
import {
  PriceCategoryOption,
  PriceModelOption,
  PriceTypeOption,
  ServiceAgreementStatusOption,
  UsageCategoryOption,
} from '@/modules/service-agreement/application/constants'
import { getPathTail } from '@/modules/shared/application/mapper-utils'
import { TreeLookup } from '@/modules/shared/presentation/lookup'
import PcaData from '@/modules/shared/application/constants/PCA.json'
import type {
  FieldDefinition,
  FormData,
  ListItemValue,
} from '@/modules/shared/presentation/diff-check/domain/types/field'
import { computed, ref } from 'vue'

type ServiceAgreementWithFiles = Omit<ServiceAgreementRequestDTO, 'expirationTime'> & {
  expirationTime: string | number | null
  contractScanFiles: FileView[]
  billFiles: FileView[]
  supplementaryAttachmentFiles: FileView[]
  servicePointSpecifications: ServicePointSpecificationInput[] | ServicePointSpecification[] | null
}

const optionLabel = (options: { label: string; value: unknown }[], value: unknown): string => {
  if (value == null) return ''
  const hit = options.find((o) => o.value === value)
  return hit?.label ?? String(value)
}

const formatDateTime = (value: string | number | null | undefined): string => {
  if (value == null || value === '') return ''
  if (typeof value === 'number') return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
  return String(value)
}

const formatPercentage = (value: unknown): string => {
  if (value == null || value === '') return ''
  return `${value}%`
}

const formatCapacity = (value: unknown): string => {
  if (value == null || value === '') return ''
  return `${value} kVA`
}

const formatVoltage = (value: unknown): string => {
  if (value == null || value === '') return ''
  return `${value} kV`
}

export const buildServiceAgreementDiffCheckFields = (): FieldDefinition[] => {
  return [
    { key: 'companyName', label: $t('domain.agreement.field.companyName') as string, type: 'text' },
    { key: 'status', label: $t('common.label.status') as string, type: 'text' },
    { key: 'industry', label: $t('domain.agreement.field.industry') as string, type: 'text' },
    { key: 'companyArea', label: $t('domain.agreement.field.area') as string, type: 'text' },
    { key: 'companyAddress', label: $t('domain.agreement.field.address') as string, type: 'text' },
    { key: 'liaisonName', label: $t('domain.agreement.field.contact') as string, type: 'text' },
    { key: 'liaisonPhone', label: $t('domain.agreement.field.phone') as string, type: 'text' },
    { key: 'liaisonPosition', label: $t('domain.agreement.field.position') as string, type: 'text' },
    { key: 'isTimeOfUsePricingEnabled', label: $t('domain.agreement.field.touEnabled') as string, type: 'text' },
    { key: 'superPeakPercentage', label: $t('domain.agreement.field.superPeak') as string, type: 'text' },
    { key: 'peakPercentage', label: $t('domain.agreement.field.peak') as string, type: 'text' },
    { key: 'standardPercentage', label: $t('domain.agreement.field.standard') as string, type: 'text' },
    { key: 'valleyPercentage', label: $t('domain.agreement.field.valley') as string, type: 'text' },
    { key: 'yearUsableCharge', label: $t('domain.agreement.field.annualUsage') as string, type: 'text' },

    { key: 'priceModel', label: $t('domain.agreement.field.priceModel') as string, type: 'text' },
    { key: 'expirationTime', label: $t('domain.agreement.field.expiryDate') as string, type: 'text' },
    { key: 'priceType', label: $t('domain.agreement.field.priceType') as string, type: 'text' },
    { key: 'priceCategory', label: $t('domain.agreement.field.priceCategory') as string, type: 'text' },
    { key: 'fixedPrice', label: $t('domain.agreement.field.fixedPrice') as string, type: 'text' },
    { key: 'fixedSpread', label: $t('domain.agreement.field.fixedSpread') as string, type: 'text' },
    { key: 'revenueShareRatio', label: $t('domain.agreement.field.shareRatio') as string, type: 'text' },
    { key: 'comment', label: $t('common.field.remark') as string, type: 'text' },

    {
      key: 'servicePointSpecifications',
      label: $t('domain.servicePoint.title') as string,
      type: 'list',
      children: [
        { key: 'serviceAccount', label: $t('domain.servicePoint.field.accountNo') as string, type: 'text' },
        { key: 'transformerCapacity', label: $t('domain.servicePoint.field.capacity') as string, type: 'text' },
        { key: 'electricityConsumptionType', label: $t('domain.servicePoint.field.category') as string, type: 'text' },
        { key: 'voltageClass', label: $t('domain.servicePoint.field.voltage') as string, type: 'text' },
      ],
    },

    { key: 'contractScanFiles', label: $t('domain.agreement.file.contract') as string, type: 'file' },
    { key: 'billFiles', label: $t('domain.agreement.file.bill') as string, type: 'file' },
    { key: 'supplementaryAttachmentFiles', label: $t('domain.agreement.file.other') as string, type: 'file' },
  ]
}

export const toServiceAgreementDiffCheckForm = (model: ServiceAgreementWithFiles): FormData => {
  const areaLookup = new TreeLookup(PcaData)

  const priceModel = ref(model.priceModel ?? null)
  const priceTypeOptions = computed(() => PriceTypeOption(priceModel))
  const priceCategoryOptions = computed(() => PriceCategoryOption(priceModel))

  const base: FormData = {
    companyName: model.companyName ?? '',
    status: optionLabel(ServiceAgreementStatusOption, model.status),
    industry: model.industry ?? '',
    companyArea: model.companyArea ? areaLookup.getFullPath(getPathTail(model.companyArea)) : '',
    companyAddress: model.companyAddress ?? '',
    liaisonName: model.liaisonName ?? '',
    liaisonPhone: model.liaisonPhone ?? '',
    liaisonPosition: model.liaisonPosition ?? '',
    isTimeOfUsePricingEnabled: model.isTimeOfUsePricingEnabled ? ($t('common.label.yes') as string) : ($t('common.label.no') as string),
    superPeakPercentage: model.isTimeOfUsePricingEnabled ? formatPercentage(model.superPeakPercentage) : '',
    peakPercentage: model.isTimeOfUsePricingEnabled ? formatPercentage(model.peakPercentage) : '',
    standardPercentage: model.isTimeOfUsePricingEnabled ? formatPercentage(model.standardPercentage) : '',
    valleyPercentage: model.isTimeOfUsePricingEnabled ? formatPercentage(model.valleyPercentage) : '',
    yearUsableCharge: model.yearUsableCharge != null ? String(model.yearUsableCharge) : '',
    priceModel: optionLabel(PriceModelOption, model.priceModel),
    expirationTime: formatDateTime(model.expirationTime),
    priceType: optionLabel(priceTypeOptions.value, model.priceType),
    priceCategory: optionLabel(priceCategoryOptions.value, model.priceCategory),
    fixedPrice: model.fixedPrice ?? '',
    fixedSpread: model.fixedSpread ?? '',
    revenueShareRatio: model.revenueShareRatio != null ? formatPercentage(model.revenueShareRatio) : '',
    comment: model.comment ?? '',
    contractScanFiles: model.contractScanFiles || [],
    billFiles: model.billFiles || [],
    supplementaryAttachmentFiles: model.supplementaryAttachmentFiles || [],
  }

  const usageLabel = (v: unknown) => optionLabel(UsageCategoryOption, v)

  const list = (model.servicePointSpecifications || []) as Array<ServicePointSpecificationInput | ServicePointSpecification>
  const listItems: ListItemValue[] = list.map((item, idx) => {
    const serviceAccount = (item as any).serviceAccount as string
    return {
      id: serviceAccount || (item as any).id || idx,
      serviceAccount: serviceAccount || '',
      transformerCapacity: formatCapacity((item as any).transformerCapacity),
      electricityConsumptionType: usageLabel((item as any).electricityConsumptionType),
      voltageClass: formatVoltage((item as any).voltageClass),
    }
  })

  base.servicePointSpecifications = listItems
  return base
}

export const toServiceAgreementDetailDiffCheckForm = (detail: ServiceAgreementDetail): FormData => {
  const model: ServiceAgreementWithFiles = {
    ...(detail as unknown as ServiceAgreementRequestDTO),
    contractScanFiles: detail.contractScanFiles,
    billFiles: detail.billFiles,
    supplementaryAttachmentFiles: detail.supplementaryAttachmentFiles,
    servicePointSpecifications: detail.servicePointSpecifications,
    expirationTime: detail.expirationTime,
    contractScanIds: detail.contractScanIds ?? null,
    billIds: detail.billIds ?? null,
    supplementaryAttachmentIds: detail.supplementaryAttachmentIds ?? null,
  }
  return toServiceAgreementDiffCheckForm(model)
}
