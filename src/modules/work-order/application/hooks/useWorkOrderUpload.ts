import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'
import axios from 'axios'

interface OssPolicyResponse {
  accessId: string
  policy: string
  signature: string
  dir: string
  host: string
  expire: string
  callback: string
}

interface OssCallbackResult {
  id: number
  fileName: string
  accessUrl: string
  expireTime: number
}

const FILE_UPLOAD_ENDPOINTS = createPrefixedEndpoints('/file', {
  POLICY: '/policy',
})

async function getOssPolicy(fileName: string): Promise<OssPolicyResponse> {
  const resp = await useRequest<OssPolicyResponse>({
    url: FILE_UPLOAD_ENDPOINTS.POLICY,
    method: 'post',
    data: { fileName },
  })
  return resp
}

async function uploadToOss(policy: OssPolicyResponse, file: File): Promise<OssCallbackResult> {
  const formData = new FormData()
  const key = `${policy.dir}${file.name}`
  formData.append('key', key)
  formData.append('policy', policy.policy)
  formData.append('OSSAccessKeyId', policy.accessId)
  formData.append('signature', policy.signature)
  formData.append('callback', policy.callback)
  formData.append('success_action_status', '200')
  formData.append('file', file)

  const response = await axios.post<OssCallbackResult>(policy.host, formData)
  return response.data
}

export async function uploadImageForMarkdown(file: File): Promise<OssCallbackResult> {
  const policy = await getOssPolicy(file.name)
  return uploadToOss(policy, file)
}

export function useWorkOrderUpload() {
  const onUploadImg = async (
    files: File[],
    callback: (urls: { url: string; alt: string; title: string }[]) => void,
  ) => {
    const results = await Promise.all(
      files.map(async (file) => {
        const result = await uploadImageForMarkdown(file)
        return {
          url: result.accessUrl,
          alt: result.fileName,
          title: result.fileName,
        }
      }),
    )
    callback(results)
  }

  return { onUploadImg }
}
