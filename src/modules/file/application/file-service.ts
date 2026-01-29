import { fileRepository } from '../infrastructure/file-repository'

export const fileService = {
  getFileById: (id: number) => fileRepository.getById(id),
  getFilesByIds: (ids: number[]) => fileRepository.getByIds(ids),
  getFilesMetaByIds: (ids: number[]) => fileRepository.getMetaByIds(ids),
}
