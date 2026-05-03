import { defineComponent, ref } from 'vue'
import { NIcon } from 'naive-ui'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'

export default defineComponent({
  name: 'DocumentSection',
  props: {
    title: {
      type: String,
      required: true,
    },
    defaultExpanded: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, { slots }) {
    const isExpanded = ref(props.defaultExpanded)

    const toggle = () => {
      isExpanded.value = !isExpanded.value
    }

    return () => (
      <div class="print-section document-section">
        {/* 标题栏：屏幕可点击，打印纯展示 */}
        <div class="section-title document-section-header" onClick={toggle}>
          {/* 屏幕显示的折叠图标 */}
          <span class="screen-only toggle-icon">
            <NIcon size="16">{isExpanded.value ? <ChevronDown /> : <ChevronRight />}</NIcon>
          </span>

          {/* 标题文本 */}
          <span>{props.title}</span>
        </div>

        {/* 内容区域 */}
        {/* 关键 CSS 类: print-force-show 确保打印时忽略 v-show 的隐藏 */}
        <div class={['document-section-content', { 'screen-hidden': !isExpanded.value }]}>
          {slots.default?.()}
        </div>
      </div>
    )
  },
})
