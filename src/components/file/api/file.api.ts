// src/api/file.api.ts

import { useRequest } from '@/hooks/request/useRequest'
import { createPrefixedEndpoints } from '../../../_utils/api/api-prefix-generator'
import type { ServerResponse } from '@/types/request'
import type { FileStorage, OssCallbackDTO } from './file-storage'

// 定义 API 端点
export const FILE_API_ENDPOINT = createPrefixedEndpoints('/file', {
  GET_BY_ID: (id: number) => `/${id}/get`,
  GET_BY_IDS: `/batch/get`,
  GET_BY_IDS_WITHOUT_OSS: '/batch/get/meta',
})

export const fileApi = {
  /**
   * 根据 ID 获取文件信息（包括新的签名 URL）
   * @param id 文件 ID
   */
  getFileById: (id: number): Promise<ServerResponse<OssCallbackDTO>> => {
    return useRequest<ServerResponse<OssCallbackDTO>, undefined>({
      method: 'GET',
      url: FILE_API_ENDPOINT.GET_BY_ID(id),
    })
  },
  /**
   * 根据 IDS 获取文件信息（包括新的签名 URL）
   * @param ids 文件 IDS
   */
  getFileByIds: (ids: number[]): Promise<ServerResponse<OssCallbackDTO[]>> => {
    return useRequest<ServerResponse<OssCallbackDTO[]>, undefined>({
      method: 'GET',
      url: FILE_API_ENDPOINT.GET_BY_IDS,
      params: {
        ids: ids,
      },
    })
  },
  /**
   * 根据 IDS 获取文件信息（不包含OSS信息）
   * @param ids 文件 IDS
   */
  getFileMetaByIds: (ids: number[]): Promise<ServerResponse<FileStorage[]>> => {
    return useRequest<ServerResponse<FileStorage[]>, undefined>({
      method: 'GET',
      url: FILE_API_ENDPOINT.GET_BY_IDS_WITHOUT_OSS,
      params: {
        ids: ids,
      },
    })
  },
}
