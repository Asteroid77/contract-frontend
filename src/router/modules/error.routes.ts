import type { AppRouteRecord } from '../types'

/**
 * 错误页面路由
 */
export const errorRoutes: AppRouteRecord[] = [
  {
    path: '/403',
    name: '403',
    component: () => import('@/views/error/403View.vue'),
    meta: {
      name: '无权限',
      requiresAuth: false,
      hideInMenu: true,
    },
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/error/404View.vue'),
    meta: {
      name: '页面不存在',
      requiresAuth: false,
      hideInMenu: true,
    },
  },
  {
    path: '/500',
    name: '500',
    component: () => import('@/views/error/500View.vue'),
    meta: {
      name: '服务器错误',
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
