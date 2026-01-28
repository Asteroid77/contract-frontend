import { describe, it, expect } from 'vitest'
// 模拟 IndexedDB 环境，要在使用dexie之前
import 'fake-indexeddb/auto'
import dexie from '@/_utils/dexie'
import type { ExceptionReport } from '@/types/exception'

describe('测试dexie是否正常加载exceptions表', async () => {
  const exceptionDB = dexie.exceptions
  const data = {
    type: 'server',
    message: 'test',
    timestamp: new Date().getTime(),
  }
  const id: string | undefined = await dexie.exceptions.add(data)
  it('自增id应该为1', async () => {
    expect(id).toBe(1)
  })
  it('新增数据与测试数据一致', async () => {
    const item: ExceptionReport<unknown> | undefined = await exceptionDB.get(id)
    expect(item).toStrictEqual({
      id: 1,
      ...data,
    })
  })
})
