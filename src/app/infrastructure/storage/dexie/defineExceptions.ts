import type { DexieDB } from './types'
/**
 * 声明exceptions表
 * @param db Dexie实例
 */
export function defineExceptions(db: DexieDB): void {
  db.version(1).stores({
    exceptions: '++id',
  })
}
