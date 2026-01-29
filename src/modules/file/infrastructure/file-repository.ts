import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'
import type { FileRepository } from '../domain/repositories'
import type { FileResponse, FileStorage } from '../domain/types'
import type { ServerResponse } from '@/modules/shared/domain/response'

const FILE_ENDPOINTS = createPrefixedEndpoints('/file', {
  GET_BY_ID: (id: number) => `/${id}/get`,
  GET_BY_IDS: '/batch/get',
  GET_BY_IDS_WITHOUT_OSS: '/batch/get/meta',
})

export const fileRepository: FileRepository = {
  async getById(id: number) {
    const response = await useRequest<ServerResponse<FileResponse>>({
      method: 'GET',
      url: FILE_ENDPOINTS.GET_BY_ID(id),
    })
    return response.data
  },
  async getByIds(ids: number[]) {
    const response = await useRequest<ServerResponse<FileResponse[]>>({
      method: 'GET',
      url: FILE_ENDPOINTS.GET_BY_IDS,
      params: {
        ids,
      },
    })
    return response.data
  },
  async getMetaByIds(ids: number[]) {
    const response = await useRequest<ServerResponse<FileStorage[]>>({
      method: 'GET',
      url: FILE_ENDPOINTS.GET_BY_IDS_WITHOUT_OSS,
      params: {
        ids,
      },
    })
    return response.data
  },
}
