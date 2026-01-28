import Dexie from 'dexie'
import type { EntityTable } from 'dexie'
import type { ExceptionReport } from '@/types/exception'
import type { RestSmsCd } from './table/defineRestSMSCd.ts'
import type { SignInResponse } from '@/types/account'
import type { QueryCacheEntry } from './table/types/QueryCache'

/**
 * Dexie管理的indexedDB 数据表类型
 * @see https://dexie.org/docs/Tutorial/Vue
 */
declare interface DexieTables {
  exceptions: EntityTable<ExceptionReport<unknown>, 'id'>
  restcd: EntityTable<RestSmsCd, 'id'>
  userinfo: EntityTable<SignInResponse, 'token'>
  queryCache: EntityTable<QueryCacheEntry, 'key'>
}
export type DexieDB = Dexie & DexieTables
