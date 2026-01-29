import { defineComponent } from 'vue'

export const DiffRenderer = defineComponent({
  name: 'DiffRenderer',
  props: {
    // 新值 (当前审批值)
    newValue: { type: [String, Number], default: null },
    // 旧值 (原值)
    oldValue: { type: [String, Number], default: null },
    // 是否显示旧值 (有些场景可能只想高亮新值)
    showOld: { type: Boolean, default: true },
  },
  setup(props) {
    return () => {
      const { newValue, oldValue, showOld } = props

      // 如果没有旧数据，或者新旧值相等 -> 只显示普通文本
      // 转字符串比对新旧值
      if (oldValue === null || oldValue === undefined || String(newValue) === String(oldValue)) {
        return <span>{newValue ?? '-'}</span>
      }

      // 有差异 -> 渲染标准 Diff 结构
      return (
        <div class="diff-container">
          {/* 新值在前：强调生效结果 */}
          <span class="diff-new">{newValue ?? '-'}</span>

          {/* 旧值在后：作为参考 */}
          {showOld && <span class="diff-old">{`( ${oldValue ?? '-'} )`}</span>}
        </div>
      )
    }
  },
})
