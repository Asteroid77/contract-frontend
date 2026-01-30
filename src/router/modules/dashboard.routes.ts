import { $t } from '@/_utils/i18n'
import type { AppRouteRecord } from '../types'
import DashboardView from '@/views/auth/DashboardView.vue'

/**
 * Dashboard 和文档相关路由
 */
export const dashboardRoutes: AppRouteRecord[] = [
  {
    path: 'dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: {
      name: $t('sign.route.home'),
      icon: 'MapsHomeWorkOutlined',
    },
  },
  {
    path: 'document',
    name: 'document',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('sign.route.document'),
      icon: 'MenuBookTwotone',
    },
  },
]
