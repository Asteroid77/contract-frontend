import db from '@/app/infrastructure/storage/dexie'
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core'
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
