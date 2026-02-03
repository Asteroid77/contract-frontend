import { $t } from '@/_utils/i18n'
import { computed, defineComponent, type PropType } from 'vue'
import FileDiffSection from '@/modules/approval/presentation/print/ApprovalPrintFileDiffSection'
import { NEmpty } from 'naive-ui'
import '@/modules/approval/presentation/approval/styles/AttachmentApprovalDiff.css'
import type { OssCallbackView } from '@/modules/file/application/models'
export default defineComponent({
  name: 'AttachmentApprovalDiff',
  props: {
    // 传入旧数据对象
    filesMap: {
      type: Object as PropType<{
        old?: Record<string, OssCallbackView[]> | null
        new: Record<string, OssCallbackView[]> | null
      }>,
      required: true,
    },
    // 规则
    rules: {
      type: Array as PropType<{ title: string; key: string }[]>,
      required: true,
    },
  },
  setup(props) {
    const isAllEmpty = computed(() => {
      // 如果没有任何规则，就视为空
      if (!props.rules || props.rules.length === 0) {
        return true
      }

      // 使用 Array.every 来检查是否【所有】规则都满足“无文件”的条件
      return props.rules.every((rule) => {
        // 获取当前规则 key 对应的新旧文件列表
        const newFiles = props.filesMap.new?.[rule.key]
        const oldFiles = props.filesMap.old?.[rule.key]

        // 判断“无文件”的条件是：新文件列表不存在或为空，并且旧文件列表也不存在或为空
        const isNewEmpty = !newFiles || newFiles.length === 0
        const isOldEmpty = !oldFiles || oldFiles.length === 0

        return isNewEmpty && isOldEmpty
      })
    })
    return () => (
      <div class="attachment-approval-container">
        {props.rules.map((item) => (
          <FileDiffSection
            title={item.title}
            oldData={props.filesMap.old?.[item.key]}
            newData={props.filesMap.new?.[item.key]}
            approvalType={props.filesMap.old === undefined ? false : true}
          />
        ))}

        {/* 如果三个都空 */}
        {isAllEmpty.value && <NEmpty description={$t('common.label.noData')} />}
      </div>
    )
  },
})
