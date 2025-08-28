import type { DexieDB } from '../types'
export declare interface RestSmsCd {
  id?: number
  phone: string //手机号
  time: Date // 发送时间
}
/**
 * 声明restSMSCd表
 * @param db Dexie实例
 */
export function defineRestSMSCd(db: DexieDB): void {
  db.version(1).stores({
    restcd: '++id, phone, time',
  })
}
