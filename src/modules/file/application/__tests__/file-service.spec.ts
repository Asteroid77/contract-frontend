import { beforeEach, describe, expect, it, vi } from 'vitest'

const repoMocks = vi.hoisted(() => ({
  getById: vi.fn(),
  getByIds: vi.fn(),
  getMetaByIds: vi.fn(),
}))

vi.mock('@/modules/file/infrastructure/file-repository', () => ({
  fileRepository: repoMocks,
}))

import { fileService } from '@/modules/file/application/file-service'

describe('fileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getFileById delegates to fileRepository.getById', async () => {
    const payload = { id: 9, fileName: 'contract.pdf' }
    repoMocks.getById.mockResolvedValue(payload)

    const result = await fileService.getFileById(9)

    expect(repoMocks.getById).toHaveBeenCalledWith(9)
    expect(result).toEqual(payload)
  })

  it('getFilesByIds delegates to fileRepository.getByIds', async () => {
    const payload = [{ id: 1, fileName: 'a.pdf' }]
    repoMocks.getByIds.mockResolvedValue(payload)

    const result = await fileService.getFilesByIds([1, 2])

    expect(repoMocks.getByIds).toHaveBeenCalledWith([1, 2])
    expect(result).toEqual(payload)
  })

  it('getFilesMetaByIds delegates to fileRepository.getMetaByIds', async () => {
    const payload = [{ id: 2, fileName: 'meta.pdf' }]
    repoMocks.getMetaByIds.mockResolvedValue(payload)

    const result = await fileService.getFilesMetaByIds([2, 3])

    expect(repoMocks.getMetaByIds).toHaveBeenCalledWith([2, 3])
    expect(result).toEqual(payload)
  })
})
