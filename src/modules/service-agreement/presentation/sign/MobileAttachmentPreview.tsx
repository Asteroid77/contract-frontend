import { defineComponent, computed, ref, type PropType } from 'vue'
import './styles/MobileAttachmentPreview.css'
import { $t } from '@/_utils/i18n'
// --- 类型定义 ---
export interface AgreementData {
  companyName: string
  companyArea: string
  contractScanIds: number[] | null
  billIds: number[] | null
  supplementaryAttachmentIds: number[] | null
  [key: string]: unknown
}

export interface FileData {
  id: number
  fileName: string
  fileType: string
  path: string // OSS 带签名的完整链接
  [key: string]: unknown
}

export default defineComponent({
  name: 'MobileAttachmentPreview',
  props: {
    agreementData: {
      type: Object as PropType<AgreementData>,
      required: true,
    },
    files: {
      type: Array as PropType<FileData[]>,
      default: () => [],
    },
  },
  setup(props) {
    // 状态：当前预览的大图链接
    const previewImage = ref<string | null>(null)

    // 判断是否为图片
    const isImage = (file: FileData) => {
      if (!file.fileName) return false
      return (
        /\.(jpg|jpeg|png|webp|gif)$/i.test(file.fileName) || file.fileType?.startsWith('image/')
      )
    }

    // 核心逻辑：根据 IDs 将文件列表分组
    const groupedFiles = computed(() => {
      const map = new Map<number, FileData>()
      props.files.forEach((f) => map.set(f.id, f))

      const getFilesByIds = (ids: number[] | null) => {
        if (!ids || !Array.isArray(ids)) return []
        return ids.map((id) => map.get(id)).filter(Boolean) as FileData[]
      }

      return {
        contract: getFilesByIds(props.agreementData.contractScanIds),
        bill: getFilesByIds(props.agreementData.billIds),
        supplementary: getFilesByIds(props.agreementData.supplementaryAttachmentIds),
      }
    })

    const isEmpty = computed(() => {
      const { contract, bill, supplementary } = groupedFiles.value
      return !contract.length && !bill.length && !supplementary.length
    })

    // 处理点击
    const handlePreview = (file: FileData) => {
      if (isImage(file)) {
        previewImage.value = file.path
      } else {
        // PDF或其他文件，新窗口打开
        window.open(file.path, '_blank')
      }
    }

    // --- 渲染子组件：文件网格 ---
    const renderFileGrid = (title: string, icon: string, fileList: FileData[]) => {
      if (!fileList.length) return null

      return (
        <section class="mobile-attachment-preview__section">
          <div class="mobile-attachment-preview__section-title">
            <span>{icon}</span> {title}
            <span class="mobile-attachment-preview__section-count">({fileList.length})</span>
          </div>
          <div class="mobile-attachment-preview__file-grid">
            {fileList.map((file) => (
              <div
                key={file.id}
                class="mobile-attachment-preview__file-card"
                onClick={() => handlePreview(file)}
              >
                <div class="mobile-attachment-preview__thumbnail">
                  {isImage(file) ? (
                    <img src={file.path} loading="lazy" alt={file.fileName} />
                  ) : (
                    <div class="mobile-attachment-preview__pdf-icon">PDF</div>
                  )}
                </div>
                <div class="mobile-attachment-preview__file-name">{file.fileName}</div>
              </div>
            ))}
          </div>
        </section>
      )
    }

    return () => (
      <div class="mobile-attachment-preview">
        {/* Header */}
        <div class="mobile-attachment-preview__header">
          <h2>{$t('domain.agreement.preview.attachmentsTitle')}</h2>
          <p class="mobile-attachment-preview__subtitle">
            {props.agreementData.companyName || $t('domain.agreement.preview.unnamedCompany')}
          </p>
        </div>

        {/* Sections */}
        {renderFileGrid(
          $t('domain.agreement.file.contract') as string,
          '📄',
          groupedFiles.value.contract,
        )}
        {renderFileGrid($t('domain.agreement.file.bill') as string, '🧾', groupedFiles.value.bill)}
        {renderFileGrid(
          $t('domain.agreement.file.other') as string,
          '📎',
          groupedFiles.value.supplementary,
        )}

        {/* Empty State */}
        {isEmpty.value && (
          <div class="mobile-attachment-preview__empty-state">
            {$t('domain.agreement.preview.noAttachmentsData')}
          </div>
        )}

        {/* Image Viewer Modal */}
        {previewImage.value && (
          <div
            class="mobile-attachment-preview__image-viewer"
            onClick={() => (previewImage.value = null)}
          >
            <img src={previewImage.value} />
            <div class="mobile-attachment-preview__close-tip">
              {$t('domain.agreement.preview.clickAnywhereToClose')}
            </div>
          </div>
        )}
      </div>
    )
  },
})
