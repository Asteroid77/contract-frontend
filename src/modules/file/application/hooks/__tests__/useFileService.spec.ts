import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  fileKeys,
  useFileDetailQuery,
  useFilesDetailQuery,
  useFilesMetaDetailQuery,
} from '@/modules/file/application/hooks/useFileService'
import { fileService } from '@/modules/file/application/file-service'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn((options) => options),
  useQueryClient: vi.fn(),
}))

vi.mock('@/modules/file/application/file-service', () => ({
  fileService: {
    getFileById: vi.fn(),
    getFilesByIds: vi.fn(),
    getFilesMetaByIds: vi.fn(),
  },
}))

vi.mock('@/app/infrastructure/query/query-request-context', () => ({
  withQueryRequestContext: vi.fn((_queryKey, _ctx, runner) => runner()),
}))

const queryClient = {
  setQueryData: vi.fn(),
}

type QueryOptionsLike<TData = unknown> = {
  queryKey: unknown
  enabled: boolean
  queryFn: (ctx: { queryKey: unknown; signal: AbortSignal }) => Promise<TData>
  staleTime?: number | ((input: { state: { data: unknown } }) => number)
}

const getLatestQueryOptions = <TData = unknown>(): QueryOptionsLike<TData> => {
  const latestCall = vi.mocked(useQuery).mock.calls.at(-1)
  if (!latestCall) {
    throw new Error('useQuery should be called before reading options')
  }
  return latestCall[0] as QueryOptionsLike<TData>
}

const createFileResponse = (id: number, expireTime: number) => ({
  id,
  fileName: `file-${id}.pdf`,
  fileType: 'application/pdf',
  fileSize: 1024,
  fileHash: `hash-${id}`,
  sourceType: {
    code: 'OSS',
    description: 'oss',
  },
  ossRegion: 'cn-hangzhou',
  ossBucket: 'bucket',
  ossObjectKey: `obj/${id}`,
  accessUrl: `https://oss.example/${id}`,
  expireTime,
  uploader: 1,
  uploadTime: '2026-02-10T10:00:00+08:00',
  status: {
    code: 'OK',
    description: 'ok',
  },
  description: null,
})

const createFileStorage = (id: number) => ({
  id,
  fileName: `file-${id}.pdf`,
  fileType: 'application/pdf',
  sourceType: {
    code: 'OSS',
    description: 'oss',
  },
  ossRegion: 'cn-hangzhou',
  ossBucket: 'bucket',
  ossObjectKey: `obj/${id}`,
  fileSize: 1024,
  fileHash: `hash-${id}`,
  uploadTime: '2026-02-10T10:00:00+08:00',
  uploader: 1,
  description: null,
  status: {
    code: 'OK',
    description: 'ok',
  },
})

describe('useFileService hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useQueryClient).mockReturnValue(queryClient as never)
  })

  it('defines stable file query keys', () => {
    expect(fileKeys.all).toEqual(['files'])
    expect(fileKeys.details()).toEqual(['files', 'detail'])
    expect(fileKeys.detail(9)).toEqual(['files', 'detail', 9])
    expect(fileKeys.batchDetail([1, 2])).toEqual(['files', 'detail', 'batch', { ids: [1, 2] }])
    expect(fileKeys.metaDetail(2)).toEqual(['files', 'meta', 2])
    expect(fileKeys.batchMetaDetail([1, 2])).toEqual(['files', 'meta', 'batch', { ids: [1, 2] }])
  })

  it('normalizes batch file keys when ids are order-insensitive', () => {
    expect(fileKeys.batchDetail([1, 2, 3])).toEqual(fileKeys.batchDetail([3, 2, 1]))
    expect(fileKeys.batchMetaDetail([10, 20, 30])).toEqual(fileKeys.batchMetaDetail([30, 10, 20]))
  })

  it('useFileDetailQuery rejects when fileId is missing', async () => {
    useFileDetailQuery(undefined)
    const options = getLatestQueryOptions()

    expect(options.queryKey).toEqual(fileKeys.detail(undefined))
    expect(options.enabled).toBe(false)

    await expect(
      options.queryFn({
        queryKey: options.queryKey,
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow('File ID is required for fileDetailQuery')
  })

  it('useFileDetailQuery delegates to service through request context', async () => {
    const payload = createFileResponse(7, Date.now() + 10 * 60 * 1000)
    vi.mocked(fileService.getFileById).mockResolvedValue(payload as never)

    const query = useFileDetailQuery(7)
    const options = getLatestQueryOptions<typeof payload>()

    expect(options.queryKey).toEqual(fileKeys.detail(7))
    expect(options.enabled).toBe(true)

    const ctx = {
      queryKey: fileKeys.detail(7),
      signal: new AbortController().signal,
    }
    const result = await options.queryFn(ctx)

    expect(withQueryRequestContext).toHaveBeenCalledWith(
      fileKeys.detail(7),
      ctx,
      expect.any(Function),
    )
    expect(fileService.getFileById).toHaveBeenCalledWith(7)
    expect(result).toEqual(payload)
    expect(query).toBe(options)
  })

  it('useFilesDetailQuery rejects when ids are empty', async () => {
    const fileIds = ref<number[]>([])

    useFilesDetailQuery(fileIds)
    const options = getLatestQueryOptions()

    expect(options.enabled).toBe(false)

    await expect(
      options.queryFn({
        queryKey: fileKeys.batchDetail([]),
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow('File ID is required for fileDetailQuery')
  })

  it('useFilesDetailQuery loads files, hydrates detail cache and computes staleTime', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-10T12:00:00.000Z'))

    const now = Date.now()
    const fileIds = ref<number[]>([1, 2])
    const files = [
      createFileResponse(1, now + 2 * 60 * 1000),
      createFileResponse(2, now + 2 * 60 * 1000),
    ]

    vi.mocked(fileService.getFilesByIds).mockResolvedValue(files as never)

    useFilesDetailQuery(fileIds)
    const options = getLatestQueryOptions<typeof files>()
    const ctx = {
      queryKey: fileKeys.batchDetail([1, 2]),
      signal: new AbortController().signal,
    }

    const result = await options.queryFn(ctx)

    expect(withQueryRequestContext).toHaveBeenCalledWith(
      fileKeys.batchDetail([1, 2]),
      ctx,
      expect.any(Function),
    )
    expect(fileService.getFilesByIds).toHaveBeenCalledWith([1, 2])
    expect(queryClient.setQueryData).toHaveBeenCalledTimes(2)
    expect(queryClient.setQueryData).toHaveBeenCalledWith(fileKeys.detail(1), files[0], {
      updatedAt: now,
    })
    expect(queryClient.setQueryData).toHaveBeenCalledWith(fileKeys.detail(2), files[1], {
      updatedAt: now,
    })
    expect(result).toEqual(files)
    if (typeof options.staleTime !== 'function') {
      throw new Error('staleTime should be function')
    }
    expect(options.staleTime({ state: { data: undefined } })).toBe(0)
    expect(options.staleTime({ state: { data: [] } })).toBe(0)
    expect(options.staleTime({ state: { data: files } })).toBe(60 * 1000)

    vi.useRealTimers()
  })

  it('useFilesMetaDetailQuery loads meta list and hydrates meta cache', async () => {
    const fileIds = ref<number[]>([10, 20])
    const files = [createFileStorage(10), createFileStorage(20)]

    vi.mocked(fileService.getFilesMetaByIds).mockResolvedValue(files as never)

    useFilesMetaDetailQuery(fileIds)
    const options = getLatestQueryOptions<typeof files>()
    const ctx = {
      queryKey: fileKeys.batchMetaDetail([10, 20]),
      signal: new AbortController().signal,
    }

    const result = await options.queryFn(ctx)

    expect(withQueryRequestContext).toHaveBeenCalledWith(
      fileKeys.batchMetaDetail([10, 20]),
      ctx,
      expect.any(Function),
    )
    expect(fileService.getFilesMetaByIds).toHaveBeenCalledWith([10, 20])
    expect(queryClient.setQueryData).toHaveBeenCalledTimes(2)
    expect(queryClient.setQueryData).toHaveBeenCalledWith(fileKeys.metaDetail(10), files[0], {
      updatedAt: expect.any(Number),
    })
    expect(queryClient.setQueryData).toHaveBeenCalledWith(fileKeys.metaDetail(20), files[1], {
      updatedAt: expect.any(Number),
    })
    expect(result).toEqual(files)
    expect(options.enabled).toBe(true)
  })
})
