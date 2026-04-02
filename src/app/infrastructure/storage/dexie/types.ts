import type { Dexie, EntityTable } from 'dexie'
import type { RestSmsCd } from './defineRestSMSCd'
import type { SignInResponseComplete } from '@/modules/user/application/models'
import type { QueryCacheEntry } from './QueryCache'

/**
 * Dexie管理的indexedDB 数据表类型
 * @see https://dexie.org/docs/Tutorial/Vue
 */
declare interface DexieTables {
  restcd: EntityTable<RestSmsCd, 'id'>
  userinfo: EntityTable<SignInResponseComplete, 'token'>
  queryCache: EntityTable<QueryCacheEntry, 'key'>
}
export type DexieDB = Dexie & DexieTables
