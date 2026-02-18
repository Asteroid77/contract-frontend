import type { AppRouteRecord } from '../types'

export const workOrderRoutes: AppRouteRecord[] = [
  {
    path: '/work-order',
    name: 'work-order',
    component: () => import('@/views/auth/WorkOrderListView.vue'),
    meta: {
      name: 'layout.menu.workOrder',
      icon: 'TicketOutline',
    },
  },
  {
    path: '/work-order/:id',
    name: 'work-order-detail',
    component: () => import('@/views/auth/WorkOrderDetailView.vue'),
    meta: {
      name: 'layout.menu.workOrderDetail',
      parent: 'work-order',
      hideInMenu: true,
    },
  },
]
