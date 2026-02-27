import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { fileRepository } from '@/modules/file/infrastructure/file-repository'

vi.mock('@/modules/shared/infrastructure/useRequest', () => ({
  useRequest: vi.fn(),
}))

describe('fileRepository contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getById calls prefixed endpoint and returns response data', async () => {
    const payload = {
      id: 9,
      fileName: 'a.pdf',
    }

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await fileRepository.getById(9)

    expect(useRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: '/file/9/get',
      responseShape: 'data',

    })
    expect(result).toEqual(payload)
  })

  it('getByIds sends ids as query params and returns response data', async () => {
    const payload = [
      {
        id: 1,
        fileName: 'a.pdf',
      },
    ]

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await fileRepository.getByIds([1, 2])

    expect(useRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: '/file/batch/get',
      params: {
        ids: [1, 2],
      },
      responseShape: 'data',

    })
    expect(result).toEqual(payload)
  })

  it('getMetaByIds uses meta endpoint and returns response data', async () => {
    const payload = [
      {
        id: 1,
        fileName: 'a.pdf',
      },
    ]

    vi.mocked(useRequest).mockResolvedValue(payload as never)

    const result = await fileRepository.getMetaByIds([1, 2])

    expect(useRequest).toHaveBeenCalledWith({
      method: 'GET',
      url: '/file/batch/get/meta',
      params: {
        ids: [1, 2],
      },
      responseShape: 'data',

    })
    expect(result).toEqual(payload)
  })
})
