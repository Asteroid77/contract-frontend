import Dexie from 'dexie'
import type { EntityTable } from 'dexie'
import type { ExceptionReport } from '@/modules/shared/application/exception/types'
import type { RestSmsCd } from './defineRestSMSCd'
import type { SignInResponse } from '@/modules/user/application/models'
import type { QueryCacheEntry } from './QueryCache'

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
