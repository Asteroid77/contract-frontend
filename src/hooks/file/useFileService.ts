import { fileApi } from '@/components/file/api/file.api'
import type { FileStorage, OssCallbackDTO } from '@/components/file/api/file-storage'
import type { ServerResponse } from '@/types/request'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { AxiosError } from 'axios'
import type { Ref } from 'vue'

// =================================================================
// QUERY KEYS (用于唯一标识缓存中的数据)
// =================================================================

export const fileKeys = {
  all: ['files'] as const,
  details: () => [...fileKeys.all, 'detail'] as const,
  detail: (id: number | undefined) => [...fileKeys.details(), id] as const,
  metaDetails: () => [...fileKeys.all, 'meta'],
  metaDetail: (id: number | undefined) => [...fileKeys.metaDetails(), id],
  batchDetail: (ids: number[]) => [...fileKeys.details(), 'batch', ...ids] as const,
  batchMetaDetail: (ids: number[]) => [...fileKeys.all, 'meta', ...ids],
}

// =================================================================
// QUERIES (用于获取数据 - GET)
// =================================================================

/**
 * 获取单个文件信息 (URL, expireTime 等) 的 Hook
 * 自动续期
 *
 * @param fileId 文件 ID
 */
export const useFileDetailQuery = (fileId: number | undefined) => {
  return useQuery<
    ServerResponse<OssCallbackDTO>,
    AxiosError<ServerResponse<unknown>>,
    OssCallbackDTO
  >({
    queryKey: fileKeys.detail(fileId),
    queryFn: () => {
      if (!fileId) return Promise.reject(new Error('File ID is required for fileDetailQuery'))
      return fileApi.getFileById(fileId)
    },
    enabled: !!fileId,
    select: (response) => response.data,
    staleTime: Infinity, // 由useFilesDetailQuery更新缓存，这个仅为缓存获取器
    gcTime: 1000 * 60 * 60 * 24,
  })
}

/**
 * 获取所有文件信息 (URL, expireTime 等) 的 Hook
 * 自动续期
 *
 * @param fileIds 文件 Id list
 */
export const useFilesDetailQuery = (fileIds: Ref<number[]>) => {
  const queryClient = useQueryClient()
  return useQuery<
    ServerResponse<OssCallbackDTO[]>,
    AxiosError<ServerResponse<unknown>>,
    OssCallbackDTO[]
  >({
    queryKey: fileKeys.batchDetail(fileIds.value),
    queryFn: async () => {
      if (!fileIds.value || !fileIds.value.length)
        return Promise.reject(new Error('File ID is required for fileDetailQuery'))
      const response = await fileApi.getFileByIds(fileIds.value)
      const files = response.data
      if (files && files.length > 0) {
        //  遍历数据并填充单个缓存
        for (const file of files) {
          const individualQueryKey = fileKeys.detail(file.id)
          queryClient.setQueryData(
            individualQueryKey,
            { data: file, message: response.message, code: response.code, status: response.status },
            { updatedAt: Date.now() },
          )
        }
      }
      return response
    },
    enabled: !!fileIds.value && !!fileIds.value.length,
    staleTime: (data) => {
      const serverResponse = data.state.data as ServerResponse<OssCallbackDTO[]> | undefined
      if (
        !serverResponse?.data ||
        !Array.isArray(serverResponse.data) ||
        serverResponse.data.length === 0
      ) {
        return 0 // 立即 stale
      }
      const expireTime = data?.state.data?.data[0].expireTime
      if (!expireTime) return 0 // 没有过期时间，立即 stale
      const buffer = 60 * 1000 // 提前 1 分钟标记为 stale
      const staleIn = expireTime - Date.now() - buffer
      return staleIn > 0 ? staleIn : 0
    },
    gcTime: 1000 * 60 * 60 * 24,
  })
}
/**
 * 获取所有文件信息 (不带oss的信息) 的 Hook
 *
 * @param fileIds 文件 Id list
 */
export const useFilesMetaDetailQuery = (fileIds: Ref<number[]>) => {
  const queryClient = useQueryClient()
  return useQuery<
    ServerResponse<FileStorage[]>,
    AxiosError<ServerResponse<unknown>>,
    FileStorage[]
  >({
    queryKey: fileKeys.batchMetaDetail(fileIds.value),
    queryFn: async () => {
      if (!fileIds.value || !fileIds.value.length)
        return Promise.reject(new Error('File ID is required for fileDetailQuery'))
      const response = await fileApi.getFileMetaByIds(fileIds.value)
      const files = response.data
      if (files && files.length > 0) {
        //  遍历数据并填充单个缓存
        for (const file of files) {
          const individualQueryKey = fileKeys.metaDetail(file.id)
          queryClient.setQueryData(
            individualQueryKey,
            { data: file, message: response.message, code: response.code, status: response.status },
            { updatedAt: Date.now() },
          )
        }
      }
      return response
    },
    enabled: !!fileIds.value && !!fileIds.value.length,
    gcTime: 1000 * 60 * 60 * 24,
  })
}
