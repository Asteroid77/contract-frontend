import db from '@/app/infrastructure/storage/dexie'
import {
  experimental_createQueryPersister,
  type PersistedClient,
  type Persister,
} from '@tanstack/query-persist-client-core'
import { getStoredAccessToken } from '@/modules/access/application/token-manager'

const QUERY_CLIENT_CACHE_KEY_PREFIX = 'query-client-cache'

const resolveQueryClientCacheKey = () => {
  const token = getStoredAccessToken()
  return `${QUERY_CLIENT_CACHE_KEY_PREFIX}:${token ?? 'anonymous'}`
}

export const queryClientPersister: Persister = {
  async persistClient(client: PersistedClient) {
    await db.queryCache.put({
      key: resolveQueryClientCacheKey(),
      value: JSON.stringify(client),
    })
  },
  async restoreClient() {
    const cached = await db.queryCache.get(resolveQueryClientCacheKey())
    if (!cached?.value) {
      return undefined
    }

    if (typeof cached.value !== 'string') {
      return undefined
    }

    try {
      return JSON.parse(cached.value) as PersistedClient
    } catch {
      return undefined
    }
  },
  async removeClient() {
    await db.queryCache.delete(resolveQueryClientCacheKey())
  },
}

export const queryPersister = experimental_createQueryPersister({
  // storage 对象需要实现 getItem, setItem, 和 removeItem 三个异步方法,key为用户token
  storage: {
    getItem: async (key) => {
      const item = await db.queryCache.get(key)
      return item ? item.value : null
    },
    setItem: async (key, value) => {
      await db.queryCache.put({ key, value })
    },
    removeItem: async (key) => {
      await db.queryCache.delete(key)
    },
  },
})
