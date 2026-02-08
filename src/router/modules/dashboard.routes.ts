import type { AppRouteRecord } from '../types'
import DashboardView from '@/views/auth/DashboardView.vue'

/**
 * Dashboard 和文档相关路由
 *
 * 特点：
 * - requiresAuth: true（需要登录，默认值）
 * - layout: 'auth'（使用认证后布局，默认值）
 * - 扁平化路径：/dashboard 而不是 /auth/dashboard
 */
export const dashboardRoutes: AppRouteRecord[] = [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: {
      name: 'layout.menu.home',
      icon: 'MapsHomeWorkOutlined',
      layout: 'auth',
    },
  },
  {
    path: '/document',
    name: 'document',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: 'layout.menu.docs',
      icon: 'MenuBookTwotone',
      layout: 'auth',
    },
  },
]
