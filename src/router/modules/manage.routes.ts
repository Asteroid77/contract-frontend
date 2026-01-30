import { $t } from '@/_utils/i18n'
import type { AppRouteRecord } from '../types'

/**
 * 管理中心相关路由
 */
export const manageRoutes: AppRouteRecord[] = [
  {
    path: 'manage',
    name: 'manage',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('layout.menu.manage'),
      icon: 'ManageAccountsOutlined',
      isTransition: true,
    },
  },
  {
    path: 'manage/user/list',
    name: 'manage-user-list',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('layout.menu.users'),
      icon: 'UserMultiple',
      parent: 'manage',
    },
  },
]
