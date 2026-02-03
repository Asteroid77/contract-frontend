import { defineComponent, type PropType } from 'vue'
import type { FieldValue } from '@/modules/shared/presentation/diff-check/domain/types/field'
import type { DiffType } from '@/modules/shared/presentation/diff-check/domain/types/diff'
import { DiffService } from '@/modules/shared/presentation/diff-check/domain/services/diffService'
import { $t } from '@/_utils/i18n'

/**
 * 内联 Diff 值展示组件
 * 在同一单元格内展示变化：旧值（删除线）→ 新值（高亮）
 */
export default defineComponent({
  name: 'InlineDiffValue',
  props: {
    oldValue: {
      type: [String, Number, Boolean, Array, Object] as PropType<FieldValue>,
      default: null,
    },
    newValue: {
      type: [String, Number, Boolean, Array, Object] as PropType<FieldValue>,
      default: null,
    },
    diffType: {
      type: String as PropType<DiffType>,
      required: true,
    },
    showOldValue: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const formatValue = (val: FieldValue): string => {
      if (DiffService.isEmpty(val)) return ''
      if (typeof val === 'boolean') return val ? ($t('common.label.yes') as string) : ($t('common.label.no') as string)
      if (Array.isArray(val)) return $t('common.label.totalItems', { count: val.length }) as string
      return String(val)
    }

    return () => {
      const oldEmpty = DiffService.isEmpty(props.oldValue)
      const newEmpty = DiffService.isEmpty(props.newValue)

      // 未变化：直接显示值
      if (props.diffType === 'unchanged') {
        if (newEmpty) {
          return <span class="field-empty">{$t('common.label.empty')}</span>
        }
        return <span>{formatValue(props.newValue)}</span>
      }

      // 新增：绿色显示新值
      if (props.diffType === 'added') {
        return <span class="diff-inline diff-inline--added">{formatValue(props.newValue)}</span>
      }

      // 删除：红色删除线显示旧值
      if (props.diffType === 'removed') {
        return <span class="diff-inline diff-inline--removed">{formatValue(props.oldValue)}</span>
      }

      // 修改：旧值删除线 + 箭头 + 新值高亮
      if (props.diffType === 'modified') {
        return (
          <span class="diff-inline-group">
            {props.showOldValue && (
              <>
                <span class="diff-inline diff-inline--old">{formatValue(props.oldValue)}</span>
                <span class="diff-arrow">→</span>
              </>
            )}
            <span class="diff-inline diff-inline--new">{formatValue(props.newValue)}</span>
          </span>
        )
      }

      return null
    }
  },
})
