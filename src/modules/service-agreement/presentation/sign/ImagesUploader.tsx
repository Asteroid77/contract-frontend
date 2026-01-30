import { computed, defineComponent, h, ref, type PropType, watchEffect } from 'vue'
import { NUpload, type UploadCustomRequestOptions, type UploadFileInfo, NIcon } from 'naive-ui'
import type { OssCallbackDTO } from '@/modules/file/application/models'
import type { FileCategory } from '@/modules/service-agreement/domain/enums'
import { message } from '@/_utils/discrete_naive_api'
import { useUploadFileMutation } from '@/modules/service-agreement/application/hooks/useSignService'
import { useFilesDetailQuery } from '@/modules/file/application/hooks/useFileService'
import { ImageOutlined } from '@vicons/material'
import { $t } from '@/_utils/i18n'

export default defineComponent({
  name: 'ImagesUploader',
  props: {
    value: {
      type: Array as PropType<number[]>,
      default: () => [],
    },
    initialFileList: {
      type: Array as PropType<OssCallbackDTO[]>,
      default: () => [],
    },
    fileCategory: {
      type: String as PropType<FileCategory>,
      required: true,
    },
    maxFiles: {
      type: Number,
      default: 3,
    },
  },
  emits: ['update:value'],
  setup(props, { emit }) {
    const uploadFileMutation = useUploadFileMutation()
    const internalFileList = ref<UploadFileInfo[]>([])

    // 标志位，用于区分是内部更新还是外部 props 变化
    const isInternalUpdate = ref(false)

    // 1. 决定是否需要通过 props.value (IDs) 来获取文件详情
    const fileIdsToFetch = computed(() => {
      // 只有当父组件没有提供完整的 initialFileList，但提供了 value (IDs) 时，才去请求
      if (props.initialFileList.length > 0) return []
      return props.value
    })

    const { data: fetchedFiles, isSuccess } = useFilesDetailQuery(fileIdsToFetch)

    // watchEffect 处理状态同步
    watchEffect(() => {
      // isInternalUpdate.value 为 true 时，意味着是组件内部操作（如上传、删除）
      // 触发了 emit，从而导致 props.value 变化。此时不应再用 props 重置内部状态。
      if (isInternalUpdate.value) {
        isInternalUpdate.value = false
        return
      }
      // initialFileList用于表单编辑回显
      if (props.initialFileList.length > 0) {
        internalFileList.value = props.initialFileList.map((file) => ({
          id: String(file.id),
          name: file.fileName,
          status: 'finished',
          url: file.accessUrl,
        }))
        return
      }

      // 如果 props.value 为空，则清空列表
      if (props.value.length === 0) {
        internalFileList.value = []
        return
      }

      // 当通过 IDs 获取数据成功后，用 fetchedFiles 初始化
      if (isSuccess.value && fetchedFiles.value) {
        // 为了防止数据刷新时覆盖正在上传的文件，合并操作
        const fetchedMap = new Map(fetchedFiles.value.map((f) => [String(f.id), f]))
        const newFileList: UploadFileInfo[] = []

        // 保留已存在的文件（包括正在上传的），只更新其 URL
        internalFileList.value.forEach((existingFile) => {
          const fetchedVersion = fetchedMap.get(existingFile.id)
          if (fetchedVersion) {
            existingFile.url = fetchedVersion.accessUrl
            newFileList.push(existingFile)
            // 从 map 中移除，剩下的就是新增的
            fetchedMap.delete(existingFile.id)
          } else if (existingFile.status !== 'finished') {
            // 保留正在上传或失败的文件
            newFileList.push(existingFile)
          }
        })

        // 添加 fetchedFiles 中新增的文件
        fetchedMap.forEach((newFile) => {
          newFileList.push({
            id: String(newFile.id),
            name: newFile.fileName,
            status: 'finished',
            url: newFile.accessUrl,
          })
        })

        internalFileList.value = newFileList
      }
    })

    const handleFileListChange = (newList: UploadFileInfo[]) => {
      internalFileList.value = newList
      const newFinishedIds = newList
        .filter((file) => file.status === 'finished' && !isNaN(Number(file.id)))
        .map((file) => Number(file.id))

      if (JSON.stringify(newFinishedIds) !== JSON.stringify(props.value)) {
        isInternalUpdate.value = true // 标记这是内部更新
        emit('update:value', newFinishedIds)
      }
    }

    const customRequest = ({ file, onFinish, onError, onProgress }: UploadCustomRequestOptions) => {
      if (!file.file) {
        onError()
        return
      }

      uploadFileMutation.mutate(
        { file: file.file, fileCategory: props.fileCategory, onProgress },
        {
          onSuccess: (response) => {
            const uploadedFileData: OssCallbackDTO = response
            message.success(`${$t('common.file.uploadSuccess', { name: file.name })}`)
            // 1. 先调用 onFinish()。通知 NUpload 组件上传已完成。
            onFinish()

            // 2. 在 NUpload 完成其内部状态更新后，再来修改数据源。
            //    通过临时 ID 找到刚刚被 NUpload 标记为 'finished' 的文件。
            const targetFile = internalFileList.value.find((item) => item.id === file.id)

            if (targetFile) {
              // 3. 原地更新文件对象，用从服务器返回的真实数据替换。
              targetFile.id = String(uploadedFileData.id)
              targetFile.url = uploadedFileData.accessUrl
              targetFile.name = uploadedFileData.fileName
            }

            // 4. 同步父组件的 value。
            handleFileListChange(internalFileList.value)
          },
          onError: (error) => {
            console.error('Upload failed:', error)
            message.error($t('common.file.uploadError', { name: file.name }))
            onError()
          },
        },
      )
    }

    const renderUploadIcon = () => h(NIcon, null, { default: () => h(ImageOutlined) })
    const createThumbnailUrl = (file: File | null, fileInfo: UploadFileInfo) => {
      if (fileInfo.url) return fileInfo.url
      if (fileInfo.file) return URL.createObjectURL(fileInfo.file)
      return ''
    }

    return () => (
      <NUpload
        file-list={internalFileList.value}
        onUpdate:fileList={handleFileListChange}
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        max={props.maxFiles}
        customRequest={customRequest}
        list-type="image-card"
        createThumbnailUrl={createThumbnailUrl}
        renderIcon={renderUploadIcon}
      />
    )
  },
})
