import { defineComponent, type PropType, computed } from 'vue'
import { NGrid, NGi, NSkeleton, NSpace } from 'naive-ui'

export type SkeletonType = 'input' | 'textarea' | 'upload'

export default defineComponent({
  name: 'FormSkeleton',
  props: {
    // 列数：支持数字(固定) 或 响应式字符串
    // 例如：传 "1 s:2" 表示手机单列，平板以上双列
    cols: {
      type: [Number, String] as PropType<number | string>,
      default: '1 s:2', // 默认自带移动端适配
    },
    // 生成多少个骨架项 (如果不传，默认生成 cols * rows)
    count: {
      type: Number,
      default: 0,
    },
    // 行数 (辅助计算 count)
    rows: {
      type: Number,
      default: 2,
    },
    // 间距：推荐使用 rem 或 px 字符串
    gap: {
      type: [Number, String] as PropType<number | string | [number, number]>,
      default: '1.5rem', // ~24px，随根字体缩放
    },
    // 骨架类型
    type: {
      type: String as PropType<SkeletonType>,
      default: 'input',
    },
    // 输入框高度
    // 与 NaiveUI Input (默认34px) 像素级对齐，避免高度抖动
    controlHeight: {
      type: String,
      default: '34px',
    },
    // Label 的大概宽度
    labelWidth: {
      type: String,
      default: '30%',
    },
  },
  setup(props) {
    // 计算需要生成的总数量
    const totalCount = computed(() => {
      if (props.count > 0) return props.count
      if (props.type === 'upload') return 1

      // 如果 cols 是响应式字符串 (如 "1 s:2")，无法简单计算乘积
      // 简单的兜底：如果是字符串，默认按 rows * 2 估算，或者由父组件显式传入 count
      const colNum = typeof props.cols === 'number' ? props.cols : 2
      return colNum * props.rows
    })

    const renderControl = () => {
      switch (props.type) {
        case 'textarea':
          // 文本域：高度使用 rem，随屏幕缩放更自然
          return <NSkeleton height="6rem" style={{ borderRadius: '3px' }} />

        case 'upload':
          // 上传块：使用 rem
          return (
            <NSpace>
              {/* 5rem ≈ 80px */}
              <NSkeleton height="5rem" width="5rem" style={{ borderRadius: '3px' }} />
              <NSkeleton height="5rem" width="5rem" style={{ borderRadius: '3px' }} />
              <NSkeleton height="5rem" width="5rem" style={{ borderRadius: '3px' }} />
            </NSpace>
          )

        case 'input':
        default:
          // 普通输入框：保持 px 以对齐真实组件
          return <NSkeleton height={props.controlHeight} round />
      }
    }

    return () => (
      <NGrid
        x-gap={props.gap}
        y-gap={props.gap}
        // 如果是 upload 类型强制 1 列，否则使用 props.cols
        cols={props.type === 'upload' ? 1 : props.cols}
      >
        {Array.from({ length: totalCount.value }).map((_, i) => (
          <NGi key={i}>
            {/* Label 骨架: margin-bottom 使用 rem */}
            <div style={{ marginBottom: '0.5rem' }}>
              <NSkeleton text style={{ width: props.labelWidth }} />
            </div>
            {/* Control 骨架 */}
            {renderControl()}
          </NGi>
        ))}
      </NGrid>
    )
  },
})
