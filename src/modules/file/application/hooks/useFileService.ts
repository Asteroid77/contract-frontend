import type { FileResponse } from '@/modules/file/domain/types'
import { fileService } from '@/modules/file/application/file-service'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import type { Ref } from 'vue'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'

function normalizeFileIds(ids: number[]) {
  return [...ids].sort((a, b) => a - b)
}

// =================================================================
// QUERY KEYS (用于唯一标识缓存中的数据)
// =================================================================

export const fileKeys = {
  all: ['files'] as const,
  details: () => [...fileKeys.all, 'detail'] as const,
  detail: (id: number | undefined) => [...fileKeys.details(), id] as const,
  metaDetails: () => [...fileKeys.all, 'meta'] as const,
  metaDetail: (id: number | undefined) => [...fileKeys.metaDetails(), id] as const,
  batchDetail: (ids: number[]) => [...fileKeys.details(), 'batch', { ids: normalizeFileIds(ids) }] as const,
  batchMetaDetail: (ids: number[]) =>
    [...fileKeys.metaDetails(), 'batch', { ids: normalizeFileIds(ids) }] as const,
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
  return useQuery({
    queryKey: fileKeys.detail(fileId),
    queryFn: (ctx) => {
      if (!fileId) return Promise.reject(new Error('File ID is required for fileDetailQuery'))
      return withQueryRequestContext(ctx.queryKey, ctx, () => fileService.getFileById(fileId))
    },
    enabled: !!fileId,
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
  return useQuery({
    queryKey: fileKeys.batchDetail(fileIds.value),
    queryFn: async (ctx) => {
      if (!fileIds.value || !fileIds.value.length)
        return Promise.reject(new Error('File ID is required for fileDetailQuery'))
      const files = await withQueryRequestContext(ctx.queryKey, ctx, () =>
        fileService.getFilesByIds(fileIds.value),
      )
      if (files && files.length > 0) {
        //  遍历数据并填充单个缓存
        for (const file of files) {
          const individualQueryKey = fileKeys.detail(file.id)
          queryClient.setQueryData(individualQueryKey, file, { updatedAt: Date.now() })
        }
      }
      return files
    },
    enabled: !!fileIds.value && !!fileIds.value.length,
    staleTime: (data) => {
      const files = data.state.data as FileResponse[] | undefined
      if (!files || !Array.isArray(files) || files.length === 0) {
        return 0 // 立即 stale
      }
      const expireTime = files[0]?.expireTime
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
  return useQuery({
    queryKey: fileKeys.batchMetaDetail(fileIds.value),
    queryFn: async (ctx) => {
      if (!fileIds.value || !fileIds.value.length)
        return Promise.reject(new Error('File ID is required for fileDetailQuery'))
      const files = await withQueryRequestContext(ctx.queryKey, ctx, () =>
        fileService.getFilesMetaByIds(fileIds.value),
      )
      if (files && files.length > 0) {
        //  遍历数据并填充单个缓存
        for (const file of files) {
          const individualQueryKey = fileKeys.metaDetail(file.id)
          queryClient.setQueryData(individualQueryKey, file, { updatedAt: Date.now() })
        }
      }
      return files
    },
    enabled: !!fileIds.value && !!fileIds.value.length,
    gcTime: 1000 * 60 * 60 * 24,
  })
}
