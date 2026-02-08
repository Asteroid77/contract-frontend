import type { AppRouteRecord } from '../types'

/**
 * 错误页面路由
 */
export const errorRoutes: AppRouteRecord[] = [
  {
    path: '/error-boundary-demo',
    name: 'error-boundary-demo',
    component: () => import('@/views/error/ErrorBoundaryDemoView'),
    meta: {
      name: 'layout.menu.errorBoundaryDemo',
      requiresAuth: true,
      hideInMenu: false,
    },
  },
  {
    path: '/403',
    name: '403',
    component: () => import('@/views/error/403View.vue'),
    meta: {
      name: 'layout.menu.error403',
      requiresAuth: false,
      hideInMenu: true,
    },
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404View.vue'),
    meta: {
      name: 'layout.menu.error404',
      requiresAuth: false,
      hideInMenu: true,
    },
  },
  {
    path: '/500',
    name: '500',
    component: () => import('@/views/error/500View.vue'),
    meta: {
      name: 'layout.menu.error500',
      requiresAuth: false,
      hideInMenu: true,
    },
  },
  // 捕获所有未匹配的路由
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: '404' },
  },
]
