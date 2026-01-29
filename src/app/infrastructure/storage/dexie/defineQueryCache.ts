import type { DexieDB } from './types'
/**
 * 声明queryCache表
 * @param db Dexie实例
 */
export function defineQueryCache(db: DexieDB): void {
  db.version(1).stores({
    queryCache: '&key, value',
  })
}
