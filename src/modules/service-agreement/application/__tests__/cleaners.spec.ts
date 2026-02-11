import { describe, expect, it } from 'vitest'
import { sanitizeServiceAgreementRequest } from '@/modules/service-agreement/application/cleaners'

const createPayload = (status: 1 | 2 | 3) => ({
  id: 1,
  status,
  companyName: '测试公司',
  companyArea: '浙江/杭州',
  companyAddress: '测试地址',
  industry: '制造业',
  liaisonName: '张三',
  liaisonPosition: '经理',
  liaisonPhone: '13800000000',
  yearUsableCharge: 100,
  isTimeOfUsePricingEnabled: true,
  peakPercentage: 25,
  superPeakPercentage: 25,
  standardPercentage: 25,
  valleyPercentage: 25,
  comment: '备注',
  priceModel: 1,
  priceType: 1,
  priceCategory: 1,
  fixedPrice: '0.45',
  fixedSpread: '0.03',
  revenueShareRatio: 10,
  expirationTime: '2026-12-31 23:59:59',
  contractScanIds: [1],
  billIds: [2],
  supplementaryAttachmentIds: [3],
  servicePointSpecifications: [
    {
      id: 1,
      agreementId: 1,
      serviceAccount: '1234567890',
      transformerCapacity: 100,
      electricityConsumptionType: 1,
      voltageClass: '10kV',
    },
  ],
  creator: null,
})

describe('sanitizeServiceAgreementRequest', () => {
  it('returns original payload when status is signing', () => {
    const payload = createPayload(2)

    const result = sanitizeServiceAgreementRequest(payload as never)

    expect(result).toBe(payload)
  })

  it('clears sign-only fields when status is not signing', () => {
    const payload = createPayload(1)

    const result = sanitizeServiceAgreementRequest(payload as never)

    expect(result).not.toBe(payload)
    expect(result.priceModel).toBeNull()
    expect(result.priceType).toBeNull()
    expect(result.priceCategory).toBeNull()
    expect(result.fixedPrice).toBeNull()
    expect(result.fixedSpread).toBeNull()
    expect(result.revenueShareRatio).toBeNull()
    expect(result.comment).toBeNull()
    expect(result.expirationTime).toBeNull()
    expect(result.billIds).toBeNull()
    expect(result.supplementaryAttachmentIds).toBeNull()
    expect(result.contractScanIds).toBeNull()
    expect(result.servicePointSpecifications).toBeNull()
  })
})
