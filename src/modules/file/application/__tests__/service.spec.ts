import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fileService } from '@/modules/file/application/file-service'
import { fileRepository } from '@/modules/file/infrastructure/file-repository'

vi.mock('@/modules/file/infrastructure/file-repository', () => ({
  fileRepository: {
    getById: vi.fn(),
    getByIds: vi.fn(),
    getMetaByIds: vi.fn(),
  },
}))

describe('fileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getFileById delegates to repository', async () => {
    const payload = { id: 1, fileName: 'a.pdf' }
    vi.mocked(fileRepository.getById).mockResolvedValue(payload as never)

    const result = await fileService.getFileById(1)

    expect(fileRepository.getById).toHaveBeenCalledWith(1)
    expect(result).toEqual(payload)
  })

  it('getFilesByIds delegates to repository', async () => {
    const payload = [{ id: 1, fileName: 'a.pdf' }]
    vi.mocked(fileRepository.getByIds).mockResolvedValue(payload as never)

    const result = await fileService.getFilesByIds([1, 2])

    expect(fileRepository.getByIds).toHaveBeenCalledWith([1, 2])
    expect(result).toEqual(payload)
  })

  it('getFilesMetaByIds delegates to repository', async () => {
    const payload = [{ id: 1, fileName: 'a.pdf' }]
    vi.mocked(fileRepository.getMetaByIds).mockResolvedValue(payload as never)

    const result = await fileService.getFilesMetaByIds([1, 2])

    expect(fileRepository.getMetaByIds).toHaveBeenCalledWith([1, 2])
    expect(result).toEqual(payload)
  })
})
