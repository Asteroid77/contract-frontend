import { describe, expect, it, vi } from 'vitest'
import dayjs from 'dayjs'

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

import {
  buildServiceAgreementDiffCheckFields,
  toServiceAgreementDetailDiffCheckForm,
  toServiceAgreementDiffCheckForm,
} from '@/modules/service-agreement/presentation/diff-check/serviceAgreementDiffCheck'

describe('serviceAgreementDiffCheck', () => {
  it('buildServiceAgreementDiffCheckFields returns expected structure', () => {
    const fields = buildServiceAgreementDiffCheckFields()

    expect(fields.length).toBeGreaterThan(10)
    expect(fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'companyName', type: 'text' }),
        expect.objectContaining({ key: 'status', type: 'text' }),
        expect.objectContaining({ key: 'contractScanFiles', type: 'file' }),
      ]),
    )

    const servicePointField = fields.find((item) => item.key === 'servicePointSpecifications')
    expect(servicePointField).toEqual(
      expect.objectContaining({
        type: 'list',
      }),
    )
    const listField = servicePointField as { children?: unknown[] } | undefined
    expect(listField?.children).toHaveLength(4)
  })

  it('toServiceAgreementDiffCheckForm maps labels and formats values when TOU enabled', () => {
    const expirationTime = dayjs('2026-02-10 12:30:00').valueOf()

    const result = toServiceAgreementDiffCheckForm({
      id: 1,
      status: 2,
      companyName: '测试公司',
      companyArea: 'foo/bar',
      companyAddress: '测试地址',
      industry: '制造业',
      liaisonName: '张三',
      liaisonPhone: '13800000000',
      liaisonPosition: '经理',
      yearUsableCharge: 120,
      isTimeOfUsePricingEnabled: true,
      superPeakPercentage: 20,
      peakPercentage: 20,
      standardPercentage: 30,
      valleyPercentage: 30,
      comment: '备注',
      priceModel: 1,
      priceType: 1,
      priceCategory: 3,
      fixedPrice: '0.45',
      fixedSpread: '0.03',
      revenueShareRatio: 15,
      expirationTime,
      contractScanIds: [1],
      billIds: [2],
      supplementaryAttachmentIds: [3],
      servicePointSpecifications: [
        {
          serviceAccount: '10001',
          transformerCapacity: 30,
          electricityConsumptionType: 1,
          voltageClass: '10',
        },
      ],
      creator: null,
      contractScanFiles: [{ id: 1, accessUrl: 'https://oss/a.pdf' }],
      billFiles: [{ id: 2, accessUrl: 'https://oss/b.pdf' }],
      supplementaryAttachmentFiles: [{ id: 3, accessUrl: 'https://oss/c.pdf' }],
    } as never)

    expect(result.status).toBe('domain.agreement.status.signing')
    expect(result.priceModel).toBe('domain.agreement.option.revenueShare')
    expect(result.priceType).toBe('domain.agreement.option.powerPlant')
    expect(result.priceCategory).toBe('domain.agreement.option.shareRatio')

    expect(result.companyArea).toBe('bar')
    expect(result.isTimeOfUsePricingEnabled).toBe('common.label.yes')
    expect(result.superPeakPercentage).toBe('20%')
    expect(result.peakPercentage).toBe('20%')
    expect(result.standardPercentage).toBe('30%')
    expect(result.valleyPercentage).toBe('30%')
    expect(result.revenueShareRatio).toBe('15%')
    expect(result.expirationTime).toBe(dayjs(expirationTime).format('YYYY-MM-DD HH:mm:ss'))

    expect(result.contractScanFiles).toEqual([{ id: 1, accessUrl: 'https://oss/a.pdf' }])
    expect(result.billFiles).toEqual([{ id: 2, accessUrl: 'https://oss/b.pdf' }])
    expect(result.supplementaryAttachmentFiles).toEqual([{ id: 3, accessUrl: 'https://oss/c.pdf' }])

    expect(result.servicePointSpecifications).toEqual([
      {
        id: '10001',
        serviceAccount: '10001',
        transformerCapacity: '30 kVA',
        electricityConsumptionType: 'domain.servicePoint.option.largeInd',
        voltageClass: '10 kV',
      },
    ])
  })

  it('toServiceAgreementDiffCheckForm clears percentage fields when TOU disabled', () => {
    const result = toServiceAgreementDiffCheckForm({
      id: 1,
      status: 1,
      companyName: '测试公司',
      companyArea: '',
      companyAddress: '',
      industry: null,
      liaisonName: '',
      liaisonPhone: '',
      liaisonPosition: '',
      yearUsableCharge: 0,
      isTimeOfUsePricingEnabled: false,
      superPeakPercentage: 20,
      peakPercentage: 20,
      standardPercentage: 30,
      valleyPercentage: 30,
      comment: null,
      priceModel: null,
      priceType: null,
      priceCategory: null,
      fixedPrice: null,
      fixedSpread: null,
      revenueShareRatio: null,
      expirationTime: null,
      contractScanIds: null,
      billIds: null,
      supplementaryAttachmentIds: null,
      servicePointSpecifications: null,
      creator: null,
      contractScanFiles: [],
      billFiles: [],
      supplementaryAttachmentFiles: [],
    } as never)

    expect(result.isTimeOfUsePricingEnabled).toBe('common.label.no')
    expect(result.superPeakPercentage).toBe('')
    expect(result.peakPercentage).toBe('')
    expect(result.standardPercentage).toBe('')
    expect(result.valleyPercentage).toBe('')
  })

  it('toServiceAgreementDetailDiffCheckForm reuses detail files and service points', () => {
    const expirationTime = dayjs('2026-03-01 08:00:00').valueOf()

    const result = toServiceAgreementDetailDiffCheckForm({
      id: 1,
      status: 2,
      companyName: '测试公司',
      companyArea: 'x/y',
      companyAddress: '测试地址',
      industry: '制造业',
      liaisonName: '张三',
      liaisonPhone: '13800000000',
      liaisonPosition: '经理',
      yearUsableCharge: 100,
      isTimeOfUsePricingEnabled: false,
      superPeakPercentage: null,
      peakPercentage: null,
      standardPercentage: null,
      valleyPercentage: null,
      comment: null,
      priceModel: null,
      priceType: null,
      priceCategory: null,
      fixedPrice: null,
      fixedSpread: null,
      revenueShareRatio: null,
      expirationTime,
      creator: 1,
      createdTime: Date.now(),
      updatedTime: Date.now(),
      contractScanIds: [1],
      billIds: [2],
      supplementaryAttachmentIds: [3],
      contractScanFiles: [{ id: 1, accessUrl: 'https://oss/a.pdf' }],
      billFiles: [{ id: 2, accessUrl: 'https://oss/b.pdf' }],
      supplementaryAttachmentFiles: [{ id: 3, accessUrl: 'https://oss/c.pdf' }],
      servicePointSpecifications: [
        {
          id: 1,
          agreementId: 1,
          serviceAccount: '90001',
          transformerCapacity: 50,
          electricityConsumptionType: 2,
          voltageClass: '20',
        },
      ],
    } as never)

    expect(result.companyArea).toBe('y')
    expect(result.contractScanFiles).toEqual([{ id: 1, accessUrl: 'https://oss/a.pdf' }])
    expect(result.servicePointSpecifications).toEqual([
      expect.objectContaining({
        serviceAccount: '90001',
        transformerCapacity: '50 kVA',
      }),
    ])
  })
})
