import type { OssCallbackView } from '@/modules/file/application/models'
import { NGi, NGrid } from 'naive-ui'
import type { PropType } from 'vue'
import { computed } from 'vue'
import { defineComponent } from 'vue'
import FileItemCard from './ApprovalPrintFileItemCard'
import '@/modules/approval/presentation/approval/styles/FileDiffSection.css'
export default defineComponent({
  name: 'file-diff-section',
  props: {
    title: { type: String, required: true },
    oldData: { type: Array as PropType<OssCallbackView[]>, required: false },
    newData: { type: Array as PropType<OssCallbackView[]>, required: false },
    approvalType: { type: Boolean, default: false },
  },
  setup(props) {
    const diffResult = computed(() => {
      if (!props.approvalType) {
        return { added: [], removed: [], kept: [], normal: props.newData || [] }
      }
      const oldFiles = props.oldData || []
      const newFiles = props.newData || []

      const oldMap = new Map(oldFiles.map((f) => [f.id, f]))
      const newMap = new Map(newFiles.map((f) => [f.id, f]))
      const added = newFiles.filter((f) => !oldMap.has(f.id))
      const removed = oldFiles.filter((f) => !newMap.has(f.id))
      const kept = newFiles.filter((f) => oldMap.has(f.id))

      return { added, removed, kept, normal: [] }
    })

    const sectionTitleClass = props.approvalType ? 'sub-section-title' : 'section-title'

    return () => {
      const { added, removed, kept, normal } = diffResult.value
      // 如果完全没数据，不渲染该板块
      if (!added.length && !removed.length && !kept.length && !normal.length) return null

      return (
        <div class="diff-section-wrapper">
          <div class={sectionTitleClass}>{props.title}</div>

          {/* 布局策略：
              1. 优先展示变化的（新增、删除）
              2. 没变化的折叠起来，或者放在最后
          */}
          <NGrid x-gap={12} y-gap={12} cols="2 s:3 m:4 l:5" responsive="screen">
            {/* 1. 已删除 */}
            {removed.map((file) => (
              <NGi key={file.id}>
                <FileItemCard file={file} status="removed" />
              </NGi>
            ))}

            {/* 2. 新增 */}
            {added.map((file) => (
              <NGi key={file.id}>
                <FileItemCard file={file} status="added" />
              </NGi>
            ))}

            {/* 3. 无变化 */}
            {kept.map((file) => (
              <NGi key={file.id}>
                <FileItemCard file={file} status="kept" />
              </NGi>
            ))}

            {/* 4. 默认 */}
            {normal.map((file) => (
              <NGi key={file.id}>
                <FileItemCard file={file} status="normal" />
              </NGi>
            ))}
          </NGrid>
        </div>
      )
    }
  },
})
