import type { FieldValue, ListItemValue, OssCallbackView } from './field'

/**
 * Diff 状态类型
 */
export type DiffType = 'unchanged' | 'modified' | 'added' | 'removed'

/**
 * 单个字段的 Diff 结果
 */
export interface FieldDiff {
  key: string
  label: string
  oldValue: FieldValue
  newValue: FieldValue
  type: DiffType
}

/**
 * 列表项的 Diff 结果
 */
export interface ListItemDiff {
  id: string | number
  type: DiffType
  oldItem: ListItemValue | null
  newItem: ListItemValue | null
  /** 该列表项内部字段的 Diff */
  fieldDiffs: FieldDiff[]
}

/**
 * 列表字段的 Diff 结果
 */
export interface ListDiff {
  key: string
  label: string
  type: DiffType
  items: ListItemDiff[]
  /** 汇总信息 */
  summary: {
    added: number
    removed: number
    modified: number
    unchanged: number
  }
}

/**
 * 文件 Diff 项
 */
export interface FileDiffItem {
  type: DiffType
  oldFile: OssCallbackView | null
  newFile: OssCallbackView | null
}

/**
 * 文件 Diff 结果
 */
export interface FileDiff {
  type: DiffType
  items: FileDiffItem[]
  summary: {
    added: number
    removed: number
    modified: number
    unchanged: number
  }
}
