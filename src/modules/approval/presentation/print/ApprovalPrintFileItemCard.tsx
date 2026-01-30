import type { OssCallbackDTO } from '@/modules/file/application/models'
import { FilePdfOutlined } from '@vicons/antd'
import { NIcon, NImage, NTag } from 'naive-ui'
import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import { $t } from '@/_utils/i18n'
import '@/modules/approval/presentation/approval/styles/FileItemCard.css'
export default defineComponent({
  props: {
    file: { type: Object as PropType<OssCallbackDTO>, required: true },
    status: { type: String as PropType<'added' | 'removed' | 'kept' | 'normal'>, required: true },
  },
  setup(props) {
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(props.file.fileName)

    // 样式映射
    const styleMap = {
      added: { borderColor: '#18a058', tagType: 'success', tagText: $t('common.action.add'), opacity: 1 },
      removed: {
        borderColor: '#d03050',
        tagType: 'error',
        tagText: $t('common.action.delete'),
        opacity: 0.6,
      },
      kept: {
        borderColor: '#e0e0e6',
        tagType: 'default',
        tagText: $t('domain.approval.label.noChange'),
        opacity: 1,
      },
      normal: {
        borderColor: '#e0e0e6',
        tagType: 'default',
        tagText: '',
        opacity: 1,
      },
    } as const

    const currentStyle = styleMap[props.status]

    const handlePdfClick = () => {
      window.open(props.file.accessUrl, '_blank')
    }

    return () => (
      <div
        class="file-diff-card"
        style={{
          border: `1px solid ${currentStyle.borderColor}`,
          opacity: currentStyle.opacity,
        }}
      >
        {/* 状态角标 */}
        {props.status !== 'normal' && (
          <div class="status-badge">
            <NTag type={currentStyle.tagType} size="small" bordered={false}>
              {currentStyle.tagText}
            </NTag>
          </div>
        )}

        {/* 内容区 */}
        <div class="card-content">
          {isImage ? (
            <NImage
              src={props.file.accessUrl}
              objectFit="cover"
              class="preview-image"
              // 启用图片预览组
              preview-src={props.file.accessUrl}
            />
          ) : (
            <div class="pdf-placeholder" onClick={handlePdfClick}>
              <NIcon size="40" color="#ff4d4f">
                <FilePdfOutlined />
              </NIcon>
              <span class="click-tip">{$t('common.action.preview')}</span>
            </div>
          )}
        </div>

        {/* 文件名 */}
        <div class="file-diff-card__name" title={props.file.fileName}>
          {props.file.fileName}
        </div>
      </div>
    )
  },
})
