import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  toDomainServiceAgreementRequest,
  toViewPreviewAttachments,
  toViewServiceAgreement,
  toViewServiceAgreementPage,
  toViewServiceAgreementRequest,
} from '@/modules/service-agreement/application/mappers'

const createDomainFile = (id: number, path: string) => ({
  id,
  fileName: `file-${id}.pdf`,
  fileType: 'application/pdf',
  sourceType: {
    code: 'OSS',
    description: 'oss',
  },
  ossRegion: 'cn-hangzhou',
  ossBucket: 'bucket',
  ossObjectKey: `obj/${id}`,
  fileSize: 1024,
  fileHash: `hash-${id}`,
  uploadTime: '2026-02-10T10:00:00+08:00',
  uploader: 1,
  description: null,
  status: {
    code: 'OK',
    description: 'ok',
  },
  path,
  expireTime: Date.now() + 60 * 1000,
})

describe('service-agreement mappers', () => {
  it('toViewServiceAgreement normalizes area, timestamps and file fields', () => {
    const domain = {
      id: 1,
      companyName: '测试公司',
      companyArea: '浙江/杭州',
      companyAddress: '测试地址',
      industry: '制造业',
      status: 2,
      liaisonName: '张三',
      liaisonPosition: '经理',
      liaisonPhone: '13800000000',
      yearUsableCharge: 100,
      isTimeOfUsePricingEnabled: true,
      peakPercentage: 20,
      superPeakPercentage: 20,
      standardPercentage: 30,
      valleyPercentage: 30,
      comment: '备注',
      priceModel: 1,
      priceType: 1,
      priceCategory: 1,
      fixedPrice: '0.45',
      fixedSpread: '0.03',
      revenueShareRatio: 12,
      expirationTime: '2026-12-31 23:59:59',
      creator: 1,
      createdTime: '2026-02-01 08:00:00',
      updatedTime: '2026-02-02 09:00:00',
      contractScanFiles: [createDomainFile(1, 'https://oss/file-1')],
      billFiles: [createDomainFile(2, 'https://oss/file-2')],
      supplementaryAttachmentFiles: [createDomainFile(3, 'https://oss/file-3')],
      servicePointSpecifications: [],
    }

    const result = toViewServiceAgreement(domain as never)

    expect(result.companyArea).toBe('杭州')
    expect(result.expirationTime).toBe(new Date('2026-12-31 23:59:59').getTime())
    expect(result.createdTime).toBe(new Date('2026-02-01 08:00:00').getTime())
    expect(result.updatedTime).toBe(new Date('2026-02-02 09:00:00').getTime())

    expect(result.contractScanFiles[0]).toEqual(
      expect.objectContaining({
        id: 1,
        accessUrl: 'https://oss/file-1',
      }),
    )
    expect('path' in result.contractScanFiles[0]).toBe(false)
  })

  it('toViewServiceAgreementPage normalizes companyArea path', () => {
    const result = toViewServiceAgreementPage({
      id: 1,
      companyName: '测试公司',
      companyArea: '浙江/杭州',
      status: 1,
      yearUsableCharge: 120,
      expirationTime: null,
    })

    expect(result).toEqual(
      expect.objectContaining({
        companyArea: '杭州',
      }),
    )
  })

  it('toViewPreviewAttachments maps old/new file lists to accessUrl shape', () => {
    const result = toViewPreviewAttachments({
      newFiles: {
        billFiles: [createDomainFile(11, 'https://oss/new-bill')],
        supplementaryAttachmentFiles: [createDomainFile(12, 'https://oss/new-attachment')],
        contractScanFiles: [createDomainFile(13, 'https://oss/new-contract')],
      },
      oldFiles: {
        billFiles: [createDomainFile(21, 'https://oss/old-bill')],
        supplementaryAttachmentFiles: [createDomainFile(22, 'https://oss/old-attachment')],
        contractScanFiles: [createDomainFile(23, 'https://oss/old-contract')],
      },
    })

    expect(result.newFiles.billFiles[0]).toEqual(
      expect.objectContaining({ id: 11, accessUrl: 'https://oss/new-bill' }),
    )
    expect(result.oldFiles.contractScanFiles[0]).toEqual(
      expect.objectContaining({ id: 23, accessUrl: 'https://oss/old-contract' }),
    )
  })

  it('toDomainServiceAgreementRequest normalizes area/date and service point fields', () => {
    const timestamp = dayjs('2026-02-10 12:30:00').valueOf()

    const result = toDomainServiceAgreementRequest({
      id: 2,
      status: 2,
      companyName: '测试公司',
      companyArea: '浙江/杭州',
      companyAddress: '测试地址',
      industry: '制造业',
      liaisonName: '张三',
      liaisonPosition: '经理',
      liaisonPhone: '13800000000',
      yearUsableCharge: 100,
      isTimeOfUsePricingEnabled: false,
      peakPercentage: null,
      superPeakPercentage: null,
      standardPercentage: null,
      valleyPercentage: null,
      comment: '',
      priceModel: null,
      priceType: null,
      priceCategory: null,
      fixedPrice: null,
      fixedSpread: null,
      revenueShareRatio: null,
      expirationTime: timestamp,
      contractScanIds: [1],
      billIds: [2],
      supplementaryAttachmentIds: [3],
      servicePointSpecifications: [
        {
          id: 9,
          agreementId: 2,
          serviceAccount: '1234567890',
          transformerCapacity: 100,
          electricityConsumptionType: 1,
          voltageClass: '10kV',
        },
      ],
    } as never)

    expect(result.companyArea).toBe('杭州')
    expect(result.expirationTime).toBe(dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'))
    expect(result.comment).toBeNull()
    expect(result.servicePointSpecifications).toEqual([
      {
        id: 9,
        agreementId: 2,
        serviceAccount: '1234567890',
        transformerCapacity: 100,
        electricityConsumptionType: 1,
        voltageClass: '10kV',
      },
    ])
    expect(result.creator).toBeNull()
  })

  it('toViewServiceAgreementRequest converts date string and fills service point default ids', () => {
    const result = toViewServiceAgreementRequest({
      id: 2,
      status: 2,
      companyName: '测试公司',
      companyArea: '浙江/杭州',
      companyAddress: '测试地址',
      industry: '制造业',
      liaisonName: '张三',
      liaisonPosition: '经理',
      liaisonPhone: '13800000000',
      yearUsableCharge: 100,
      isTimeOfUsePricingEnabled: false,
      peakPercentage: null,
      superPeakPercentage: null,
      standardPercentage: null,
      valleyPercentage: null,
      comment: null,
      priceModel: null,
      priceType: null,
      priceCategory: null,
      fixedPrice: null,
      fixedSpread: null,
      revenueShareRatio: null,
      expirationTime: '2026-02-10 12:30:00',
      contractScanIds: [1],
      billIds: [2],
      supplementaryAttachmentIds: [3],
      servicePointSpecifications: [
        {
          serviceAccount: '1234567890',
          transformerCapacity: 100,
          electricityConsumptionType: 1,
          voltageClass: '10kV',
        },
      ],
      creator: null,
    } as never)

    expect(result.companyArea).toBe('杭州')
    expect(result.expirationTime).toBe(new Date('2026-02-10 12:30:00').getTime())
    expect(result.servicePointSpecifications).toEqual([
      {
        id: 0,
        agreementId: 0,
        serviceAccount: '1234567890',
        transformerCapacity: 100,
        electricityConsumptionType: 1,
        voltageClass: '10kV',
      },
    ])
  })
})
