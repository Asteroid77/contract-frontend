import { serviceAgreementApi } from '@/components/sign/api/sign.api'
import type { OssCallbackDTO } from '@/components/file/api/file-storage'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { fileKeys } from '@/hooks/file/useFileService'
import type {
  PreviewAttachmentsVO,
  ServiceAgreementPageDTO,
  ServiceAgreementPreviewAttachmentsDTO,
  ServiceAgreementRequestDTO,
  ServiceAgreementVo,
} from '@/components/sign/api/sign'
import type { BasePageRequest, ServerResponse } from '@/types/request'
import type { ApprovalInstance } from '@/components/approval/api/approval'
import { computed, type Ref } from 'vue'
import type { AxiosError } from 'axios'

export const signKeys = {
  all: ['service-agreements'] as const,
  lists: () => [...signKeys.all, 'list'] as const,
  list: (params: BasePageRequest<ServiceAgreementPageDTO>) =>
    [...signKeys.lists(), params] as const,
  detail: (id: number) => [...signKeys.all, 'detail', id] as const,
  preview: (params: ServiceAgreementPreviewAttachmentsDTO) =>
    [...signKeys.all, 'preview', params] as const,
}

// =================================================================
// QUERIES (用于获取数据 - GET)
// =================================================================

/**
 * 获取备案/签约详情
 */
export const useServiceAgreementDetail = (id: Ref<number | null>) => {
  return useQuery({
    queryKey: computed(() => signKeys.detail(id.value!)),
    queryFn: () => serviceAgreementApi.get(id.value!).then((res) => res.data),
    enabled: computed(() => id.value !== null && id.value > 0),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 分页查询备案/签约列表
 */
export const useServiceAgreementPage = (
  pageRequest: Ref<BasePageRequest<ServiceAgreementPageDTO>>,
) => {
  return useQuery({
    queryKey: computed(() => signKeys.list(pageRequest.value)),
    queryFn: () => serviceAgreementApi.page(pageRequest.value).then((res) => res.data),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}

/**
 * 根据访问码获取预览附件
 *
 * @param paramsRef
 */
export const usePreviewAttachments = (
  paramsRef: Ref<ServiceAgreementPreviewAttachmentsDTO>,
  enabled: Ref<boolean>,
) => {
  return useQuery<
    ServerResponse<PreviewAttachmentsVO>,
    AxiosError<ServerResponse<unknown>>,
    PreviewAttachmentsVO
  >({
    queryKey: signKeys.preview(paramsRef.value!),
    queryFn: () => serviceAgreementApi.getPreviewAttachments(paramsRef.value),
    enabled: computed(() => enabled.value),

    staleTime: 5 * 60 * 1000, // 5 分钟
    gcTime: 10 * 60 * 1000, // 10 分钟

    retry: false,
  })
}

// =================================================================
// MUTATIONS (用于创建、更新、删除数据 - POST, PUT, DELETE)
// =================================================================
/**
 * 上传文件的 Hook
 * @param onSuccessCallback 可选的成功回调
 */
export const useUploadFileMutation = (onSuccessCallback?: (data: OssCallbackDTO) => void) => {
  const queryClient = useQueryClient()

  return useMutation({
    // mutationFn 接收的参数会从 .mutate(params) 传递过来
    mutationFn: (variables: {
      file: File
      fileCategory: string
      onProgress: (e: { percent: number }) => void
    }) =>
      serviceAgreementApi.uploadFile(variables.file, variables.fileCategory, variables.onProgress),

    onSuccess: (response) => {
      // 从 ServerResponse 中提取出核心数据
      const uploadedFileData = response.data

      // 关键：将上传成功后的数据手动写入 useFileDetailQuery 的缓存
      queryClient.setQueryData(fileKeys.detail(uploadedFileData.id), response, {
        updatedAt: Date.now(),
      })

      // 如果有外部传入的成功回调，则执行
      if (onSuccessCallback) {
        onSuccessCallback(uploadedFileData)
      }
    },

    onError: (error) => {
      console.error('文件上传 mutation 失败:', error)
    },
    meta: {
      toastOnSuccess: false,
    },
  })
}
/**
 * 提交签约 (Sign)
 */
export const useSubmitSignMutation = (
  callback?: (resp: ServerResponse<ApprovalInstance<ServiceAgreementRequestDTO>>) => void,
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ServiceAgreementRequestDTO) => serviceAgreementApi.sign(data),
    onSuccess: (response) => {
      // 提交成功后，通常需要刷新列表
      queryClient.invalidateQueries({ queryKey: signKeys.lists() })
      if (callback) {
        callback(response)
      }
    },
  })
}
/**
 * 保存备案 (Record)
 */
export const useSubmitRecordMutation = (
  callback?: (serviceResponse: ServerResponse<ServiceAgreementVo>) => void,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ServiceAgreementRequestDTO) => serviceAgreementApi.record(data),
    onSuccess: (response) => {
      const savedData = response.data
      queryClient.invalidateQueries({ queryKey: signKeys.lists() })

      // 如果保存后停留在当前页面，可以更新详情缓存，避免重新 fetch
      if (savedData.id) {
        queryClient.setQueryData(signKeys.detail(savedData.id), response)
      }
      if (callback) {
        callback(response)
      }
    },
  })
}
/**
 * 重名校验 (Duplicate Check)
 */
export const useDuplicateCheckMutation = () => {
  return useMutation({
    mutationFn: (params: { companyName: string; pca: string }) =>
      serviceAgreementApi.duplicateCheck(params.companyName, params.pca),
  })
}
