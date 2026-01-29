import { $t } from '@/_utils/i18n'
import { isEqual } from 'lodash'

export class ApprovalPrintFieldRenderUtil<T> {
  private newData: T
  private oldData: T | null
  constructor(newData: T, oldData: T | null) {
    this.newData = newData
    this.oldData = oldData
  }
  render = (key: keyof T, formatter?: (val: unknown) => string | number) => {
    const newData = this.newData
    const oldData = this.oldData
    // 格式化新值
    const displayNew = formatter ? formatter(newData[key]) : (newData[key] ?? '-')
    // 1. 如果没有对比数据，直接返回新值 (普通模式)
    if (!oldData) {
      return displayNew
    }
    const newVal = newData[key]
    const oldVal = oldData[key]
    // 2. 如果值相等，返回新值 (无变化)
    // 注意：这里做简单的值比较。如果是对象/数组，需要用 isEqual
    if (newVal === oldVal || isEqual(newVal, oldVal)) {
      return displayNew
    }

    // 3. 值不相等，渲染 Diff 样式 (修订模式)
    const displayOld = formatter ? formatter(oldVal) : (oldVal ?? '-')

    return (
      <span class="diff-container">
        <span class="diff-new">{displayNew}</span>
        <span class="diff-old">
          ({$t('common.past')}: {displayOld})
        </span>
      </span>
    )
  }
}
