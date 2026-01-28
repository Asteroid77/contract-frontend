import Dexie from 'dexie'
import type { DexieDB } from './types.ts'
import { defineExceptions } from './table/defineExceptions.ts'
import { defineRestSMSCd } from './table/defineRestSMSCd.ts'
import { defineUserInfo } from './table/defineUserInfo.ts'
import { defineQueryCache } from './table/defineQueryCache.ts'

const db: DexieDB = new Dexie('Database') as DexieDB

// 声明exceptions表
defineExceptions(db)
// 声明短信校验码存储表
defineRestSMSCd(db)
// 声明用户信息存储表
defineUserInfo(db)
// 声明请求信息存储表
defineQueryCache(db)
/**
 * 返回初始化后的Dexie indexedDB实例
 */
export default db
