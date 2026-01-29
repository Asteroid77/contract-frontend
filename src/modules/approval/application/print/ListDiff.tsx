import { isEqual } from 'lodash'

// ==========================================
// compareList 逻辑
// ==========================================
export interface DiffRow<T> {
  data: T
  oldData?: T | null
  status: 'added' | 'removed' | 'modified' | 'same'
}

export function compareList<T>(
  newList: T[],
  oldList: T[] | null | undefined,
  keyField: keyof T,
): DiffRow<T>[] {
  const safeOldList = oldList || []
  const result: DiffRow<T>[] = []
  const oldMap = new Map<unknown, T>()

  safeOldList.forEach((item) => {
    const key = item[keyField]
    if (key) oldMap.set(key, item)
  })

  newList.forEach((newItem) => {
    const key = newItem[keyField]
    const oldItem = oldMap.get(key)
    if (!oldItem) {
      result.push({ data: newItem, status: oldList === null ? 'added' : 'same' }) // comparison数据为undefined时,说明处于表单模式，不需要提供diff功能
    } else {
      oldMap.delete(key)
      if (isEqual(newItem, oldItem)) {
        result.push({ data: newItem, status: 'same' })
      } else {
        result.push({ data: newItem, status: 'modified', oldData: oldItem })
      }
    }
  })

  oldMap.forEach((oldItem) => {
    result.push({ data: oldItem, status: 'removed', oldData: oldItem })
  })

  return result
}
