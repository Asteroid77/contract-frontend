import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { serviceAgreementRepository } from '@/modules/service-agreement/infrastructure/service-agreement-repository'

vi.mock('@/modules/shared/infrastructure/useRequest', () => ({
  useRequest: vi.fn(),
}))

describe('serviceAgreementRepository contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploadFile builds formData, reports progress and returns data', async () => {
    const file = new File(['x'], 'a.txt', { type: 'text/plain' })
    const progressSpy = vi.fn()
    const payload = { id: 1, path: 'https://oss/a.txt' }

    vi.mocked(useRequest).mockImplementation((config: any) => {
      config.onUploadProgress({ loaded: 1, total: 2 })
      return Promise.resolve({ data: payload } as never)
    })

    const result = await serviceAgreementRepository.uploadFile(file, 'BILL', progressSpy)

    const requestConfig = vi.mocked(useRequest).mock.calls[0][0] as any

    expect(requestConfig.method).toBe('POST')
    expect(requestConfig.url).toBe('/service_agreement/upload')
    expect(requestConfig.headers).toEqual({
      'Content-Type': undefined,
    })
    expect(requestConfig.data).toBeInstanceOf(FormData)
    expect(requestConfig.data.get('file')).toBe(file)
    expect(requestConfig.data.get('fileCategory')).toBe('BILL')
    expect(progressSpy).toHaveBeenCalledWith({ percent: 50 })
    expect(result).toEqual(payload)
  })

  it('sign posts dto and returns data', async () => {
    const payload = { id: 1, approvalData: {} }
    const dto = { id: 1, companyName: '测试公司' }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await serviceAgreementRepository.sign(dto as never)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/service_agreement/sign',
      data: dto,
    })
    expect(result).toEqual(payload)
  })

  it('record posts dto and returns data', async () => {
    const payload = { id: 1, companyName: '测试公司' }
    const dto = { id: 1, companyName: '测试公司' }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await serviceAgreementRepository.record(dto as never)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/service_agreement/record',
      data: dto,
    })
    expect(result).toEqual(payload)
  })

  it('duplicateCheck sends params by post and returns boolean', async () => {
    vi.mocked(useRequest).mockResolvedValue({ data: true } as never)

    const result = await serviceAgreementRepository.duplicateCheck('测试公司', '浙江/杭州')

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/service_agreement/duplicate_check',
      params: {
        companyName: '测试公司',
        pca: '浙江/杭州',
      },
    })
    expect(result).toBe(true)
  })

  it('get sends id in query params and returns data', async () => {
    const payload = { id: 9 }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await serviceAgreementRepository.get(9)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: '/service_agreement/get',
      params: {
        id: 9,
      },
    })
    expect(result).toEqual(payload)
  })

  it('page posts pageRequest and returns page data', async () => {
    const request = {
      page: 1,
      size: 20,
      query: {
        filters: [],
      },
    }
    const payload = {
      records: [],
      total: 0,
    }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await serviceAgreementRepository.page(request as never)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/service_agreement/page',
      data: request,
    })
    expect(result).toEqual(payload)
  })

  it('getPreviewAttachments posts params and returns data', async () => {
    const request = {
      id: 1,
      type: 1,
      code: '1234',
    }
    const payload = {
      newFiles: {},
      oldFiles: {},
    }

    vi.mocked(useRequest).mockResolvedValue({ data: payload } as never)

    const result = await serviceAgreementRepository.getPreviewAttachments(request as never)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/service_agreement/preview/attachments',
      data: request,
    })
    expect(result).toEqual(payload)
  })
})
