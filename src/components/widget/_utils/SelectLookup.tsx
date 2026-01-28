// 定义 Value 的可能类型
export type SelectValue = string | number | boolean | undefined | null

// 定义选项接口
export interface SelectOption {
  label: string
  value: SelectValue
  [key: string]: unknown // 允许其他属性
}

export class SelectLookup {
  // 核心 Map：Key 是 Value，Value 是 Label
  private valueMap = new Map<SelectValue, string>()

  constructor(selectData: SelectOption[]) {
    if (selectData && selectData.length) {
      this.buildMaps(selectData)
    }
  }

  /**
   * 构建映射关系
   *
   */
  private buildMaps(selectData: SelectOption[]) {
    selectData.forEach((item) => {
      this.valueMap.set(item.value, item.label)
    })
  }

  /**
   * 根据 value 获取 label
   * @param value 字典值
   * @param showValueIfMissing 如果找不到，是否直接返回 value 本身 (默认 true)
   */
  getLabel(value: SelectValue, showValueIfMissing: boolean = true): string {
    // 1. 如果是空值，返回空字符串
    if (value === undefined || value === null || value === '') {
      return ''
    }

    // 2. 尝试从 Map 获取
    const label = this.valueMap.get(value)

    console.log(label, value)

    // 3. 如果找到了，返回 label
    if (label !== undefined) {
      return label
    }

    // 4. 如果没找到，根据配置决定是返回原值还是空串
    return showValueIfMissing ? String(value) : ''
  }
}
