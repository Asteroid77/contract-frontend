import { beforeEach, describe, expect, it, vi } from 'vitest'
import { serviceAgreementService } from '@/modules/service-agreement/application/service'
import { serviceAgreementRepository } from '@/modules/service-agreement/infrastructure/service-agreement-repository'
import { toDomainPageRequest } from '@/modules/shared/application/query/legacy-query-adapter'
import {
  toViewPreviewAttachments,
  toViewServiceAgreement,
  toViewServiceAgreementPage,
} from '@/modules/service-agreement/application/mappers'
import { sanitizeServiceAgreementRequest } from '@/modules/service-agreement/application/cleaners'
import { toOssCallbackView } from '@/modules/file/application/models'

vi.mock('@/modules/service-agreement/infrastructure/service-agreement-repository', () => ({
  serviceAgreementRepository: {
    uploadFile: vi.fn(),
    sign: vi.fn(),
    record: vi.fn(),
    duplicateCheck: vi.fn(),
    get: vi.fn(),
    page: vi.fn(),
    getPreviewAttachments: vi.fn(),
  },
}))

vi.mock('@/modules/shared/application/query/legacy-query-adapter', () => ({
  toDomainPageRequest: vi.fn(),
}))

vi.mock('@/modules/service-agreement/application/mappers', () => ({
  toViewServiceAgreement: vi.fn((data) => data),
  toViewServiceAgreementPage: vi.fn((data) => data),
  toViewPreviewAttachments: vi.fn((data) => data),
}))

vi.mock('@/modules/service-agreement/application/cleaners', () => ({
  sanitizeServiceAgreementRequest: vi.fn((data) => data),
}))

vi.mock('@/modules/file/application/models', () => ({
  toOssCallbackView: vi.fn((data) => data),
}))

describe('serviceAgreementService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploadFile delegates to repository and maps upload response', async () => {
    const file = new File(['x'], 'a.txt', { type: 'text/plain' })
    const progress = vi.fn()
    const payload = { id: 1, path: 'https://oss/a.txt' }
    const mapped = { id: 1, accessUrl: 'https://oss/a.txt' }

    vi.mocked(serviceAgreementRepository.uploadFile).mockResolvedValue(payload as never)
    vi.mocked(toOssCallbackView).mockReturnValue(mapped as never)

    const result = await serviceAgreementService.uploadFile(file, 'BILL', progress)

    expect(serviceAgreementRepository.uploadFile).toHaveBeenCalledWith(file, 'BILL', progress)
    expect(toOssCallbackView).toHaveBeenCalledWith(payload)
    expect(result).toEqual(mapped)
  })

  it('sign sanitizes payload then calls repository', async () => {
    const form = { id: 1, status: 2 }
    const sanitized = { id: 1, status: 2, cleaned: true }
    const payload = {
      id: 100,
      approvalData: { id: 1 },
      sourceData: null,
    }

    vi.mocked(sanitizeServiceAgreementRequest).mockReturnValue(sanitized as never)
    vi.mocked(serviceAgreementRepository.sign).mockResolvedValue(payload as never)

    const result = await serviceAgreementService.sign(form as never)

    expect(sanitizeServiceAgreementRequest).toHaveBeenCalledWith(form)
    expect(serviceAgreementRepository.sign).toHaveBeenCalledWith(sanitized)
    expect(result).toEqual(payload)
  })

  it('record sanitizes payload, calls repository and maps response', async () => {
    const form = { id: 1, status: 1 }
    const sanitized = { id: 1, status: 1, cleaned: true }
    const payload = { id: 2, companyName: '测试公司' }
    const mapped = { id: 2, companyName: '测试公司', mapped: true }

    vi.mocked(sanitizeServiceAgreementRequest).mockReturnValue(sanitized as never)
    vi.mocked(serviceAgreementRepository.record).mockResolvedValue(payload as never)
    vi.mocked(toViewServiceAgreement).mockReturnValue(mapped as never)

    const result = await serviceAgreementService.record(form as never)

    expect(sanitizeServiceAgreementRequest).toHaveBeenCalledWith(form)
    expect(serviceAgreementRepository.record).toHaveBeenCalledWith(sanitized)
    expect(toViewServiceAgreement).toHaveBeenCalledWith(payload)
    expect(result).toEqual(mapped)
  })

  it('duplicateCheck and get pass through repository and mapping', async () => {
    vi.mocked(serviceAgreementRepository.duplicateCheck).mockResolvedValue(true)
    vi.mocked(serviceAgreementRepository.get).mockResolvedValue({ id: 9 } as never)
    vi.mocked(toViewServiceAgreement).mockReturnValue({ id: 9, mapped: true } as never)

    const duplicate = await serviceAgreementService.duplicateCheck('测试公司', '浙江/杭州')
    const detail = await serviceAgreementService.get(9)

    expect(serviceAgreementRepository.duplicateCheck).toHaveBeenCalledWith('测试公司', '浙江/杭州')
    expect(duplicate).toBe(true)

    expect(serviceAgreementRepository.get).toHaveBeenCalledWith(9)
    expect(toViewServiceAgreement).toHaveBeenCalledWith({ id: 9 })
    expect(detail).toEqual({ id: 9, mapped: true })
  })

  it('page maps request and each page record', async () => {
    const pageRequest = {
      page: 1,
      size: 20,
      query: {
        companyName: {
          condition: 'like',
          value: '测试',
        },
      },
    }
    const mappedRequest = {
      page: 1,
      size: 20,
      query: {
        filters: [],
      },
    }
    const payload = {
      records: [{ id: 1 }, { id: 2 }],
      total: 2,
    }

    vi.mocked(toDomainPageRequest).mockReturnValue(mappedRequest as never)
    vi.mocked(serviceAgreementRepository.page).mockResolvedValue(payload as never)
    vi.mocked(toViewServiceAgreementPage)
      .mockReturnValueOnce({ id: 1, mapped: true } as never)
      .mockReturnValueOnce({ id: 2, mapped: true } as never)

    const result = await serviceAgreementService.page(pageRequest as never)

    expect(toDomainPageRequest).toHaveBeenCalledWith(pageRequest)
    expect(serviceAgreementRepository.page).toHaveBeenCalledWith(mappedRequest)
    expect(toViewServiceAgreementPage).toHaveBeenCalledTimes(2)
    expect(result).toEqual({
      records: [
        { id: 1, mapped: true },
        { id: 2, mapped: true },
      ],
      total: 2,
    })
  })

  it('getPreviewAttachments maps repository response', async () => {
    const params = {
      id: 1,
      type: 1,
      code: '1234',
    }
    const payload = {
      newFiles: {},
      oldFiles: {},
    }
    const mapped = {
      newFiles: { mapped: true },
      oldFiles: { mapped: true },
    }

    vi.mocked(serviceAgreementRepository.getPreviewAttachments).mockResolvedValue(payload as never)
    vi.mocked(toViewPreviewAttachments).mockReturnValue(mapped as never)

    const result = await serviceAgreementService.getPreviewAttachments(params as never)

    expect(serviceAgreementRepository.getPreviewAttachments).toHaveBeenCalledWith(params)
    expect(toViewPreviewAttachments).toHaveBeenCalledWith(payload)
    expect(result).toEqual(mapped)
  })
})
