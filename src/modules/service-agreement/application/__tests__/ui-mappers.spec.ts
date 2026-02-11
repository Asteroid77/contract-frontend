import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  convertUIToRequestDTO,
  createAttachmentInfoModel,
  createCustomerInfoModel,
  createServiceAgreementModel,
  createSignInfoModel,
} from '@/modules/service-agreement/application/ui-mappers'

describe('service-agreement ui mappers', () => {
  it('createCustomerInfoModel returns defaults for empty origin', () => {
    const result = createCustomerInfoModel()

    expect(result).toEqual({
      id: null,
      status: 1,
      companyName: '',
      companyArea: '',
      companyAddress: '',
      industry: null,
      liaisonName: '',
      liaisonPosition: '',
      liaisonPhone: '',
      yearUsableCharge: 0,
      isTimeOfUsePricingEnabled: false,
      peakPercentage: null,
      superPeakPercentage: null,
      standardPercentage: null,
      valleyPercentage: null,
      comment: '',
    })
  })

  it('createSignInfoModel maps expiration timestamp and service points', () => {
    const timestamp = dayjs('2026-02-10 12:30:00').valueOf()

    const result = createSignInfoModel({
      priceModel: 1,
      priceType: 1,
      priceCategory: 1,
      fixedPrice: '0.45',
      fixedSpread: '0.03',
      revenueShareRatio: 10,
      expirationTime: timestamp,
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
    } as never)

    expect(result.priceModel).toBe(1)
    expect(result.expirationTime).toBe(timestamp)
    expect(result.servicePointSpecifications).toHaveLength(1)
    expect(result.comment).toBeNull()
  })

  it('createAttachmentInfoModel prioritizes explicit ids then falls back to files', () => {
    const result = createAttachmentInfoModel({
      contractScanFiles: [{ id: 10 }],
      billIds: [20],
      supplementaryAttachmentFiles: [{ id: 30 }],
    } as never)

    expect(result).toEqual({
      contractScanIds: [10],
      billIds: [20],
      supplementaryAttachmentIds: [30],
    })
  })

  it('createServiceAgreementModel composes three ui sections', () => {
    const result = createServiceAgreementModel({
      id: 9,
      companyName: '测试公司',
      status: 2,
      contractScanFiles: [{ id: 1 }],
    } as never)

    expect(result.customerInfo.id).toBe(9)
    expect(result.customerInfo.companyName).toBe('测试公司')
    expect(result.customerInfo.status).toBe(2)
    expect(result.attachmentInfo.contractScanIds).toEqual([1])
  })

  it('convertUIToRequestDTO trims strings and formats expiration time', () => {
    const expirationTime = dayjs('2026-02-10 12:30:00').valueOf()

    const result = convertUIToRequestDTO({
      customerInfo: {
        id: 1,
        status: 2,
        companyName: '  测试公司  ',
        companyArea: '  杭州  ',
        companyAddress: '  地址  ',
        industry: '  制造业  ',
        liaisonName: '  张三  ',
        liaisonPosition: '  经理  ',
        liaisonPhone: ' 13800000000 ',
        yearUsableCharge: 100,
        isTimeOfUsePricingEnabled: true,
        peakPercentage: 20,
        superPeakPercentage: 20,
        standardPercentage: 30,
        valleyPercentage: 30,
        comment: '  备注  ',
      },
      signInfo: {
        priceModel: 1,
        priceType: 1,
        priceCategory: 1,
        fixedPrice: '0.45',
        fixedSpread: '0.03',
        revenueShareRatio: 12,
        expirationTime,
        servicePointSpecifications: [],
        comment: null,
      },
      attachmentInfo: {
        contractScanIds: [1],
        billIds: [2],
        supplementaryAttachmentIds: [3],
      },
    } as never)

    expect(result).toEqual(
      expect.objectContaining({
        id: 1,
        status: 2,
        companyName: '测试公司',
        companyArea: '杭州',
        companyAddress: '地址',
        industry: '制造业',
        liaisonName: '张三',
        liaisonPosition: '经理',
        liaisonPhone: '13800000000',
        comment: '备注',
        expirationTime: dayjs(expirationTime).format('YYYY-MM-DD HH:mm:ss'),
        contractScanIds: [1],
        billIds: [2],
        supplementaryAttachmentIds: [3],
        creator: null,
      }),
    )
  })
})
