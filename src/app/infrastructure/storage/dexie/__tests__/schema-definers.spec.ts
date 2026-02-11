import { describe, expect, it, vi } from 'vitest'
import { defineQueryCache } from '@/app/infrastructure/storage/dexie/defineQueryCache'
import { defineRestSMSCd } from '@/app/infrastructure/storage/dexie/defineRestSMSCd'
import { defineUserInfo } from '@/app/infrastructure/storage/dexie/defineUserInfo'

const createMockDb = () => {
  const stores = vi.fn()
  const version = vi.fn(() => ({ stores }))
  return {
    version,
    stores,
  }
}

describe('dexie schema definers', () => {
  it('defineQueryCache registers queryCache table schema', () => {
    const mockDb = createMockDb()

    defineQueryCache(mockDb as never)

    expect(mockDb.version).toHaveBeenCalledWith(1)
    expect(mockDb.stores).toHaveBeenCalledWith({
      queryCache: '&key, value',
    })
  })

  it('defineRestSMSCd registers restcd table schema', () => {
    const mockDb = createMockDb()

    defineRestSMSCd(mockDb as never)

    expect(mockDb.version).toHaveBeenCalledWith(1)
    expect(mockDb.stores).toHaveBeenCalledWith({
      restcd: '++id, phone, time',
    })
  })

  it('defineUserInfo registers userinfo table schema', () => {
    const mockDb = createMockDb()

    defineUserInfo(mockDb as never)

    expect(mockDb.version).toHaveBeenCalledWith(1)
    expect(mockDb.stores).toHaveBeenCalledWith({
      userinfo: 'token',
    })
  })
})
