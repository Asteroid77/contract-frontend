import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'

export const CATEGORY_ENDPOINTS = createPrefixedEndpoints('/api/work-order-categories', {
  LIST: '',
  CREATE: '',
  UPDATE: (id: number) => `/${id}`,
  DELETE: (id: number) => `/${id}`,
})
