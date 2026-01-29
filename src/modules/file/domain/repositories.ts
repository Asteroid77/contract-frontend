import type { FileResponse, FileStorage } from './types'

export interface FileRepository {
  getById(id: number): Promise<FileResponse>
  getByIds(ids: number[]): Promise<FileResponse[]>
  getMetaByIds(ids: number[]): Promise<FileStorage[]>
}
