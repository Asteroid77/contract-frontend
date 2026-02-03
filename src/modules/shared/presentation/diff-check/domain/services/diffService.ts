import type { FieldDefinition, FieldValue, ListItemValue, FormData, OssCallbackView } from '../types/field'
import type { DiffType, FieldDiff, ListItemDiff, ListDiff, FileDiffItem } from '../types/diff'

/**
 * Diff 计算服务
 */
export class DiffService {
  /**
   * 判断值是否为空
   */
  static isEmpty(value: FieldValue): boolean {
    if (value == null) return true
    if (typeof value === 'string' && value.trim() === '') return true
    if (Array.isArray(value) && value.length === 0) return true
    return false
  }

  /**
   * 判断两个值是否相等
   */
  static isEqual(a: FieldValue, b: FieldValue): boolean {
    if (a === b) return true
    if (a == null && b == null) return true
    if (a == null || b == null) return false
    if (Array.isArray(a) && Array.isArray(b)) {
      return JSON.stringify(a) === JSON.stringify(b)
    }
    return String(a) === String(b)
  }

  /**
   * 获取两个值的 Diff 类型
   */
  static getDiffType(oldValue: FieldValue, newValue: FieldValue): DiffType {
    const oldEmpty = this.isEmpty(oldValue)
    const newEmpty = this.isEmpty(newValue)
    if (oldEmpty && newEmpty) return 'unchanged'
    if (oldEmpty && !newEmpty) return 'added'
    if (!oldEmpty && newEmpty) return 'removed'
    if (this.isEqual(oldValue, newValue)) return 'unchanged'
    return 'modified'
  }

  /**
   * 计算单个字段的 Diff
   */
  static computeFieldDiff(fieldDef: FieldDefinition, oldData: FormData, newData: FormData): FieldDiff {
    return {
      key: fieldDef.key,
      label: fieldDef.label,
      oldValue: oldData[fieldDef.key],
      newValue: newData[fieldDef.key],
      type: this.getDiffType(oldData[fieldDef.key], newData[fieldDef.key]),
    }
  }

  /**
   * 计算列表字段的 Diff
   */
  static computeListDiff(fieldDef: FieldDefinition, oldData: FormData, newData: FormData): ListDiff {
    const oldList = (oldData[fieldDef.key] as ListItemValue[]) || []
    const newList = (newData[fieldDef.key] as ListItemValue[]) || []
    const childFields = fieldDef.children || []

    const newMap = new Map(newList.map((item) => [item.id, item]))
    const items: ListItemDiff[] = []
    const processedIds = new Set<string | number>()

    // 处理旧列表中的项
    for (const oldItem of oldList) {
      processedIds.add(oldItem.id)
      const newItem = newMap.get(oldItem.id)

      if (!newItem) {
        // 被删除的项
        items.push({
          id: oldItem.id,
          type: 'removed',
          oldItem,
          newItem: null,
          fieldDiffs: childFields.map((f) => ({
            key: f.key,
            label: f.label,
            oldValue: oldItem[f.key],
            newValue: null,
            type: 'removed' as DiffType,
          })),
        })
      } else {
        // 存在的项，检查内部字段变化
        const fieldDiffs = childFields.map((f) => ({
          key: f.key,
          label: f.label,
          oldValue: oldItem[f.key],
          newValue: newItem[f.key],
          type: this.getDiffType(oldItem[f.key], newItem[f.key]),
        }))
        const hasChanges = fieldDiffs.some((d) => d.type !== 'unchanged')
        items.push({
          id: oldItem.id,
          type: hasChanges ? 'modified' : 'unchanged',
          oldItem,
          newItem,
          fieldDiffs,
        })
      }
    }

    // 处理新增的项
    for (const newItem of newList) {
      if (!processedIds.has(newItem.id)) {
        items.push({
          id: newItem.id,
          type: 'added',
          oldItem: null,
          newItem,
          fieldDiffs: childFields.map((f) => ({
            key: f.key,
            label: f.label,
            oldValue: null,
            newValue: newItem[f.key],
            type: 'added' as DiffType,
          })),
        })
      }
    }

    const summary = {
      added: items.filter((i) => i.type === 'added').length,
      removed: items.filter((i) => i.type === 'removed').length,
      modified: items.filter((i) => i.type === 'modified').length,
      unchanged: items.filter((i) => i.type === 'unchanged').length,
    }

    return {
      key: fieldDef.key,
      label: fieldDef.label,
      type: summary.added || summary.removed || summary.modified ? 'modified' : 'unchanged',
      items,
      summary,
    }
  }

  /**
   * 判断是否为文件对象
   */
  static isFileObject(value: unknown): value is OssCallbackView {
    if (!value || typeof value !== 'object') return false
    const obj = value as Record<string, unknown>
    return 'id' in obj && 'fileName' in obj && 'accessUrl' in obj
  }

  /**
   * 标准化文件值为数组
   */
  static normalizeFileValue(value: FieldValue): OssCallbackView[] {
    if (this.isEmpty(value)) return []
    if (Array.isArray(value)) {
      return value.filter((v) => this.isFileObject(v)) as OssCallbackView[]
    }
    if (this.isFileObject(value)) {
      return [value]
    }
    return []
  }

  /**
   * 兼容旧调用：历史代码使用 `normalizeFiles`
   */
  static normalizeFiles(value: FieldValue): OssCallbackView[] {
    return this.normalizeFileValue(value)
  }

  /**
   * 判断两个文件是否相同（基于关键属性）
   */
  static isSameFile(a: OssCallbackView, b: OssCallbackView): boolean {
    // 优先用 ossObjectKey 判断（最准确）
    if (a.ossObjectKey && b.ossObjectKey) {
      return a.ossObjectKey === b.ossObjectKey
    }
    // 其次用 id + fileName + fileSize
    return a.id === b.id && a.fileName === b.fileName && a.fileSize === b.fileSize
  }

  /**
   * 计算文件字段的 Diff
   */
  static computeFileDiff(oldValue: FieldValue, newValue: FieldValue): FileDiffItem[] {
    const oldFiles = this.normalizeFileValue(oldValue)
    const newFiles = this.normalizeFileValue(newValue)
    const result: FileDiffItem[] = []
    const matchedNewIds = new Set<number>()

    // 处理旧文件
    for (const oldFile of oldFiles) {
      // 查找匹配的新文件（按 id 匹配）
      const newFile = newFiles.find((f) => f.id === oldFile.id)

      if (!newFile) {
        // 文件被删除
        result.push({
          type: 'removed',
          oldFile,
          newFile: null,
        })
      } else {
        matchedNewIds.add(newFile.id)
        if (this.isSameFile(oldFile, newFile)) {
          // 文件未变化
          result.push({
            type: 'unchanged',
            oldFile,
            newFile,
          })
        } else {
          // 同 id 但内容变化（替换）
          result.push({
            type: 'modified',
            oldFile,
            newFile,
          })
        }
      }
    }

    // 处理新增文件
    for (const newFile of newFiles) {
      if (!matchedNewIds.has(newFile.id)) {
        result.push({
          type: 'added',
          oldFile: null,
          newFile,
        })
      }
    }

    return result
  }
}

