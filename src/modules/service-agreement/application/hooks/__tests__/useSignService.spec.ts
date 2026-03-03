import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import {
  signKeys,
  useDuplicateCheckMutation,
  usePreviewAttachments,
  useServiceAgreementDetail,
  useServiceAgreementPage,
  useSubmitRecordMutation,
  useSubmitSignMutation,
  useUploadFileMutation,
} from '@/modules/service-agreement/application/hooks/useSignService'
import { serviceAgreementService } from '@/modules/service-agreement/application/service'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import { fileKeys } from '@/modules/file/application/hooks/useFileService'
import type { ServiceAgreementPageQuery } from '@/modules/service-agreement/application/models'
import type { BasePageRequest } from '@/modules/shared/application/request/types'

vi.mock('@tanstack/vue-query', () => ({
  keepPreviousData: 'KEEP_PREVIOUS_DATA',
  useQuery: vi.fn((options) => options),
  useMutation: vi.fn((options) => options),
  useQueryClient: vi.fn(),
}))

vi.mock('@/modules/service-agreement/application/service', () => ({
  serviceAgreementService: {
    get: vi.fn(),
    page: vi.fn(),
    getPreviewAttachments: vi.fn(),
    uploadFile: vi.fn(),
    sign: vi.fn(),
    record: vi.fn(),
    duplicateCheck: vi.fn(),
  },
}))

vi.mock('@/app/infrastructure/query/query-request-context', () => ({
  withQueryRequestContext: vi.fn((_queryKey, _ctx, runner) => runner()),
}))

const queryClient = {
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
}

type QueryOptionsLike<TData = unknown> = {
  queryKey: unknown
  enabled?: { value: boolean }
  placeholderData?: unknown
  retry?: boolean
  queryFn: (ctx: { queryKey: unknown; signal: AbortSignal }) => Promise<TData> | TData
}

type MutationOptionsLike<TData = unknown, TVariables = unknown> = {
  mutationFn: (variables: TVariables) => Promise<TData> | TData
  onSuccess?: (data: TData) => void
  meta?: Record<string, unknown>
}

const getLatestQueryOptions = <TData = unknown>(): QueryOptionsLike<TData> => {
  const latestCall = vi.mocked(useQuery).mock.calls.at(-1)
  if (!latestCall) {
    throw new Error('useQuery should be called before reading options')
  }
  return latestCall[0] as QueryOptionsLike<TData>
}

const getLatestMutationOptions = <TData = unknown, TVariables = unknown>(): MutationOptionsLike<
  TData,
  TVariables
> => {
  const latestCall = vi.mocked(useMutation).mock.calls.at(-1)
  if (!latestCall) {
    throw new Error('useMutation should be called before reading options')
  }
  return latestCall[0] as MutationOptionsLike<TData, TVariables>
}

describe('useSignService hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useQueryClient).mockReturnValue(queryClient as never)
  })

  it('defines stable sign keys', () => {
    expect(signKeys.all).toEqual(['service-agreements'])
    expect(signKeys.lists()).toEqual(['service-agreements', 'list'])
    expect(signKeys.detail(9)).toEqual(['service-agreements', 'detail', 9])
    expect(signKeys.preview({ id: 1, type: 1, code: '1234' })).toEqual([
      'service-agreements',
      'preview',
      { id: 1, type: 1, code: '1234' },
    ])
  })

  it('useServiceAgreementDetail uses computed key/enabled and delegates queryFn', async () => {
    const id = ref<number | null>(9)
    vi.mocked(serviceAgreementService.get).mockResolvedValue({ id: 9 } as never)

    useServiceAgreementDetail(id)
    const options = getLatestQueryOptions<{ id: number }>()
    expect((options.queryKey as { value: unknown }).value).toEqual(signKeys.detail(9))
    expect((options.enabled as { value: boolean }).value).toBe(true)

    const ctx = {
      queryKey: signKeys.detail(9),
      signal: new AbortController().signal,
    }
    const result = await options.queryFn(ctx)

    expect(withQueryRequestContext).toHaveBeenCalledWith(
      signKeys.detail(9),
      ctx,
      expect.any(Function),
    )
    expect(serviceAgreementService.get).toHaveBeenCalledWith(9)
    expect(result).toEqual({ id: 9 })

    id.value = null
    expect((options.enabled as { value: boolean }).value).toBe(false)
  })

  it('useServiceAgreementPage keeps previous data and delegates queryFn', async () => {
    const pageRequest = ref<BasePageRequest<ServiceAgreementPageQuery>>({
      page: 1,
      size: 20,
      query: {},
    })
    const payload = {
      records: [],
      total: 0,
    }
    vi.mocked(serviceAgreementService.page).mockResolvedValue(payload as never)

    useServiceAgreementPage(pageRequest)
    const options = getLatestQueryOptions<typeof payload>()

    expect((options.queryKey as { value: unknown }).value).toEqual(signKeys.list(pageRequest.value))
    expect(options.placeholderData).toBe('KEEP_PREVIOUS_DATA')

    const ctx = {
      queryKey: signKeys.list(pageRequest.value),
      signal: new AbortController().signal,
    }
    const result = await options.queryFn(ctx)

    expect(withQueryRequestContext).toHaveBeenCalledWith(ctx.queryKey, ctx, expect.any(Function))
    expect(serviceAgreementService.page).toHaveBeenCalledWith(pageRequest.value)
    expect(result).toEqual(payload)
  })

  it('usePreviewAttachments respects enabled ref and delegates queryFn', async () => {
    const paramsRef = ref({
      id: 1,
      type: 1 as const,
      code: '1234',
    })
    const enabled = ref(true)

    vi.mocked(serviceAgreementService.getPreviewAttachments).mockResolvedValue({
      newFiles: {},
      oldFiles: {},
    } as never)

    usePreviewAttachments(paramsRef, enabled)
    const options = getLatestQueryOptions()

    expect(options.queryKey).toEqual(signKeys.preview(paramsRef.value))
    expect((options.enabled as { value: boolean }).value).toBe(true)
    expect(options.retry).toBe(false)

    const ctx = {
      queryKey: signKeys.preview(paramsRef.value),
      signal: new AbortController().signal,
    }
    await options.queryFn(ctx)

    expect(withQueryRequestContext).toHaveBeenCalledWith(ctx.queryKey, ctx, expect.any(Function))
    expect(serviceAgreementService.getPreviewAttachments).toHaveBeenCalledWith(paramsRef.value)

    enabled.value = false
    expect((options.enabled as { value: boolean }).value).toBe(false)
  })

  it('useUploadFileMutation writes file detail cache and executes callback', async () => {
    const callback = vi.fn()
    const onProgress = vi.fn()
    const file = new File(['x'], 'a.txt', { type: 'text/plain' })
    const uploaded = {
      id: 7,
      accessUrl: 'https://oss/a.txt',
    }

    vi.mocked(serviceAgreementService.uploadFile).mockResolvedValue(uploaded as never)

    useUploadFileMutation(callback)
    const options = getLatestMutationOptions<
      typeof uploaded,
      { file: File; fileCategory: 'BILL'; onProgress: typeof onProgress }
    >()

    await options.mutationFn({
      file,
      fileCategory: 'BILL',
      onProgress,
    })

    expect(serviceAgreementService.uploadFile).toHaveBeenCalledWith(file, 'BILL', onProgress)

    if (!options.onSuccess) throw new Error('onSuccess should be defined')
    options.onSuccess(uploaded)

    expect(queryClient.setQueryData).toHaveBeenCalledWith(fileKeys.detail(7), uploaded, {
      updatedAt: expect.any(Number),
    })
    expect(callback).toHaveBeenCalledWith(uploaded)
    expect(options.meta).toEqual({
      toastOnError: false,
      toastOnSuccess: false,
    })
  })

  it('useSubmitSignMutation invalidates list and runs callback', async () => {
    const callback = vi.fn()
    const payload = {
      id: 100,
      approvalData: { id: 1 },
      sourceData: null,
    }

    vi.mocked(serviceAgreementService.sign).mockResolvedValue(payload as never)

    useSubmitSignMutation(callback)
    const options = getLatestMutationOptions<typeof payload, { id: number }>()

    await options.mutationFn({ id: 1 })
    expect(serviceAgreementService.sign).toHaveBeenCalledWith({ id: 1 })

    if (!options.onSuccess) throw new Error('onSuccess should be defined')
    options.onSuccess(payload)
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: signKeys.lists() })
    expect(callback).toHaveBeenCalledWith(payload)
  })

  it('useSubmitRecordMutation invalidates list and updates detail cache when id exists', async () => {
    const callback = vi.fn()
    const payload = {
      id: 9,
      companyName: '测试公司',
    }

    vi.mocked(serviceAgreementService.record).mockResolvedValue(payload as never)

    useSubmitRecordMutation(callback)
    const options = getLatestMutationOptions<typeof payload, { id: number }>()

    await options.mutationFn({ id: 9 })
    expect(serviceAgreementService.record).toHaveBeenCalledWith({ id: 9 })

    if (!options.onSuccess) throw new Error('onSuccess should be defined')
    options.onSuccess(payload)
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: signKeys.lists() })
    expect(queryClient.setQueryData).toHaveBeenCalledWith(signKeys.detail(9), payload)
    expect(callback).toHaveBeenCalledWith(payload)
  })

  it('useDuplicateCheckMutation forwards params', async () => {
    vi.mocked(serviceAgreementService.duplicateCheck).mockResolvedValue(true)

    useDuplicateCheckMutation()
    const options = getLatestMutationOptions<boolean, { companyName: string; pca: string }>()

    const result = await options.mutationFn({
      companyName: '测试公司',
      pca: '浙江/杭州',
    })

    expect(serviceAgreementService.duplicateCheck).toHaveBeenCalledWith('测试公司', '浙江/杭州')
    expect(result).toBe(true)
  })
})
