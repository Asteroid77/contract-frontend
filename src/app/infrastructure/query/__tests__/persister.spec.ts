import { describe, expect, it, vi } from 'vitest'

const { dbMock, createPersisterMock } = vi.hoisted(() => {
  const db = {
    queryCache: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  }

  const createPersister = vi.fn((options: unknown) => ({
    __options: options,
  }))

  return {
    dbMock: db,
    createPersisterMock: createPersister,
  }
})

vi.mock('@/app/infrastructure/storage/dexie', () => ({
  default: dbMock,
}))

vi.mock('@tanstack/query-persist-client-core', () => ({
  experimental_createQueryPersister: createPersisterMock,
}))

import { queryPersister } from '@/app/infrastructure/query/tanstack_query_persist_with_dexie'

type QueryPersisterStorage = {
  getItem: (key: string) => Promise<unknown>
  setItem: (key: string, value: unknown) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

type QueryPersisterWithOptions = {
  __options?: {
    storage: QueryPersisterStorage
  }
}

describe('query persister (dexie)', () => {
  it('creates persister with async storage adapter', () => {
    const persister = queryPersister as QueryPersisterWithOptions
    expect(createPersisterMock).toHaveBeenCalledTimes(1)
    expect(persister.__options?.storage).toBeTruthy()
  })

  it('storage.getItem returns cached value or null', async () => {
    const persister = queryPersister as QueryPersisterWithOptions
    const storage = persister.__options!.storage

    dbMock.queryCache.get.mockResolvedValueOnce({ key: 'k1', value: 'v1' })
    await expect(storage.getItem('k1')).resolves.toBe('v1')

    dbMock.queryCache.get.mockResolvedValueOnce(undefined)
    await expect(storage.getItem('k2')).resolves.toBeNull()
  })

  it('storage.setItem and removeItem delegate to dexie queryCache table', async () => {
    const persister = queryPersister as QueryPersisterWithOptions
    const storage = persister.__options!.storage

    await storage.setItem('k3', { foo: 'bar' })
    expect(dbMock.queryCache.put).toHaveBeenCalledWith({ key: 'k3', value: { foo: 'bar' } })

    await storage.removeItem('k3')
    expect(dbMock.queryCache.delete).toHaveBeenCalledWith('k3')
  })
})
