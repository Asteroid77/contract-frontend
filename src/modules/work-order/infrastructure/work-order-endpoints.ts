import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'

export const WORK_ORDER_ENDPOINTS = createPrefixedEndpoints('/api/work-orders', {
  LIST: '',
  CREATE: '',
  DETAIL: (id: number) => `/${id}`,
  REPLIES: (id: number) => `/${id}/replies`,
  ADD_REPLY: (id: number) => `/${id}/replies`,
  CANCEL: (id: number) => `/${id}/cancel`,
  COMPLETE: (id: number) => `/${id}/complete`,
  REJECT_HANDLER: (id: number) => `/${id}/reject-handler`,
  REOPEN: (id: number) => `/${id}/reopen`,
  SCORE: (id: number) => `/${id}/score`,
  REMOVE_BLACKLIST: (handlerId: number) => `/blacklist/${handlerId}`,
})

export const HANDLER_ENDPOINTS = createPrefixedEndpoints('/api/handler', {
  CATEGORIES: '/work-order-categories',
  LIST: '/work-orders',
  PENDING_COUNT: '/work-orders/pending-count',
  DETAIL: (id: number) => `/work-orders/${id}`,
  CLAIM: (id: number) => `/work-orders/${id}/claim`,
  RELEASE: (id: number) => `/work-orders/${id}/release`,
  REPLIES: (id: number) => `/work-orders/${id}/replies`,
  ADD_REPLY: (id: number) => `/work-orders/${id}/replies`,
  COMPLETE: (id: number) => `/work-orders/${id}/complete`,
  PERFORMANCE: '/work-orders/performance',
})
