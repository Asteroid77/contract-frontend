import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineQueryCache } from '@/app/infrastructure/storage/dexie/defineQueryCache'
import { defineRestSMSCd } from '@/app/infrastructure/storage/dexie/defineRestSMSCd'
import { defineUserInfo } from '@/app/infrastructure/storage/dexie/defineUserInfo'

const dexieConstructorSpy = vi.fn((name: string) => ({
  __dbName: name,
}))

vi.mock('dexie', () => ({
  default: dexieConstructorSpy,
}))

vi.mock('@/app/infrastructure/storage/dexie/defineRestSMSCd', () => ({
  defineRestSMSCd: vi.fn(),
}))

vi.mock('@/app/infrastructure/storage/dexie/defineUserInfo', () => ({
  defineUserInfo: vi.fn(),
}))

vi.mock('@/app/infrastructure/storage/dexie/defineQueryCache', () => ({
  defineQueryCache: vi.fn(),
}))

describe('dexie index initializer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('creates dexie instance and applies all schema definers', async () => {
    const module = await import('@/app/infrastructure/storage/dexie/index')

    expect(dexieConstructorSpy).toHaveBeenCalledWith('Database')

    const dbInstance = module.default
    expect(dbInstance).toEqual({ __dbName: 'Database' })

    expect(defineRestSMSCd).toHaveBeenCalledWith(dbInstance)
    expect(defineUserInfo).toHaveBeenCalledWith(dbInstance)
    expect(defineQueryCache).toHaveBeenCalledWith(dbInstance)
  })
})
