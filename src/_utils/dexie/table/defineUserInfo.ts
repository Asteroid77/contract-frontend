import type { DexieDB } from '../types'

/**
 * 声明userInfo表
 * @param db Dexie实例
 */
export function defineUserInfo(db: DexieDB): void {
  db.version(1).stores({
    userinfo: 'token',
  })
}
