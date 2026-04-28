import type { OssCallbackView } from '@/modules/file/application/models'
import { resolveAllowedAccessUrl } from '@/modules/shared/application/security/access-url'
import { FilePdfOutlined } from '@vicons/antd'
import { NIcon, NImage, NTag } from 'naive-ui'
import type { PropType } from 'vue'
import { computed, defineComponent } from 'vue'
import { $t } from '@/_utils/i18n'
import '@/modules/approval/presentation/approval/styles/FileItemCard.css'
export default defineComponent({
  props: {
    file: { type: Object as PropType<OssCallbackView>, required: true },
    status: { type: String as PropType<'added' | 'removed' | 'kept' | 'normal'>, required: true },
  },
  setup(props) {
    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(props.file.fileName)
    const accessUrl = computed(() => resolveAllowedAccessUrl(props.file.accessUrl))

    // 样式映射
    const styleMap = {
      added: {
        tagType: 'success',
        tagText: $t('common.action.add'),
        modifier: 'added',
      },
      removed: {
        tagType: 'error',
        tagText: $t('common.action.delete'),
        modifier: 'removed',
      },
      kept: {
        tagType: 'default',
        tagText: $t('domain.approval.label.noChange'),
        modifier: 'kept',
      },
      normal: {
        tagType: 'default',
        tagText: '',
        modifier: 'normal',
      },
    } as const

    const currentStyle = styleMap[props.status]

    const handlePdfClick = () => {
      if (!accessUrl.value) return
      window.open(accessUrl.value, '_blank')
    }

    return () => (
      <div class={['file-diff-card', `file-diff-card--${currentStyle.modifier}`]}>
        {/* 状态角标 */}
        {props.status !== 'normal' && (
          <div class="file-diff-card__badge">
            <NTag type={currentStyle.tagType} size="small" bordered={false}>
              {currentStyle.tagText}
            </NTag>
          </div>
        )}

        {/* 内容区 */}
        <div class="file-diff-card__content">
          {isImage ? (
            <NImage
              src={accessUrl.value ?? undefined}
              objectFit="cover"
              class="file-diff-card__preview-image"
              preview-src={accessUrl.value ?? undefined}
            />
          ) : (
            <div class="file-diff-card__pdf-placeholder" onClick={handlePdfClick}>
              <NIcon size="40">
                <FilePdfOutlined />
              </NIcon>
              <span class="file-diff-card__click-tip">{$t('common.action.preview')}</span>
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
