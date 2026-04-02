import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { serviceAgreementRepository } from '@/modules/service-agreement/infrastructure/service-agreement-repository'
import type { CustomAxiosRequestConfig } from '@/modules/shared/application/request/types'
import axios from 'axios'

vi.mock('@/modules/shared/infrastructure/useRequest', () => ({
  useRequest: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

type UploadRequestConfig = CustomAxiosRequestConfig<FormData> & {
  onUploadProgress?: (event: { loaded: number; total?: number }) => void
}

type RecordedRequestConfig = {
  method?: string
  url?: string
  headers?: Record<string, unknown>
  data?: FormData | Record<string, unknown>
}

type RecordedAxiosUploadConfig = {
  onUploadProgress?: (event: { loaded: number; total?: number }) => void
}

describe('serviceAgreementRepository contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploadFile requests oss policy, uploads to oss, reports progress and returns data', async () => {
    const file = new File(['x'], 'a.txt', { type: 'text/plain' })
    const progressSpy = vi.fn()
    const policy = {
      accessId: 'test-access-id',
      policy: 'encoded-policy',
      signature: 'signed-value',
      dir: 'service-agreement/',
      host: 'https://oss.example.com',
      expire: '1741852800',
      callback: 'base64-callback',
    }
    const payload = { id: 1, fileName: 'a.txt', path: 'https://oss/a.txt', expireTime: 1234567890 }

    vi.mocked(useRequest).mockResolvedValueOnce(policy as never)
    vi.mocked(axios.post).mockImplementation((_url, _data, config) => {
      const uploadConfig = config as RecordedAxiosUploadConfig
      uploadConfig.onUploadProgress?.({ loaded: 1, total: 2 })
      return Promise.resolve({ data: payload } as never)
    })

    const result = await serviceAgreementRepository.uploadFile(file, 'BILL', progressSpy)

    const requestConfig = vi.mocked(useRequest).mock.calls[0][0] as RecordedRequestConfig

    expect(requestConfig).toEqual({
      method: 'POST',
      url: '/file/policy',
      data: {
        fileName: 'a.txt',
      },
    })

    expect(axios.post).toHaveBeenCalledTimes(1)
    const [uploadUrl, requestData] = vi.mocked(axios.post).mock.calls[0] ?? []
    expect(uploadUrl).toBe('https://oss.example.com')
    expect(requestData).toBeInstanceOf(FormData)
    if (!(requestData instanceof FormData)) {
      throw new Error('request payload is not FormData')
    }

    expect(requestData.get('key')).toBe('service-agreement/a.txt')
    expect(requestData.get('policy')).toBe('encoded-policy')
    expect(requestData.get('OSSAccessKeyId')).toBe('test-access-id')
    expect(requestData.get('signature')).toBe('signed-value')
    expect(requestData.get('callback')).toBe('base64-callback')
    expect(requestData.get('success_action_status')).toBe('200')
    expect(requestData.get('file')).toBe(file)
    expect(progressSpy).toHaveBeenCalledWith({ percent: 50 })
    expect(result).toEqual(payload)
  })

  it('sign posts dto and returns data', async () => {
    const payload = { id: 1, approvalData: {} }
    const dto = { id: 1, companyName: '测试公司' }

    vi.mocked(useRequest).mockResolvedValue(payload as never)

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

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await serviceAgreementRepository.record(dto as never)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/service_agreement/record',
      data: dto,
    })
    expect(result).toEqual(payload)
  })

  it('duplicateCheck sends params by post and returns boolean', async () => {
    vi.mocked(useRequest).mockResolvedValue(true as never)

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

    vi.mocked(useRequest).mockResolvedValue(payload as never)

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

    vi.mocked(useRequest).mockResolvedValue(payload as never)

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

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await serviceAgreementRepository.getPreviewAttachments(request as never)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'POST',
      url: '/service_agreement/preview/attachments',
      data: request,
    })
    expect(result).toEqual(payload)
  })
})
