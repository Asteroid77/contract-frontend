import { $t } from '@/_utils/i18n'
import type { AppRouteRecord } from '../types'

/**
 * 用户中心相关路由
 */
export const userRoutes: AppRouteRecord[] = [
  {
    path: 'user',
    name: 'user',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('layout.menu.profile'),
      icon: 'UserSwitchOutlined',
      isTransition: true,
    },
  },
  {
    path: 'user/additional-info',
    name: 'user-additional-info',
    component: () => import('@/views/auth/UserAdditionalInfoView.vue'),
    meta: {
      name: $t('layout.menu.additional'),
      icon: 'UserData',
      parent: 'user',
    },
  },
  {
    path: 'user/agent/list',
    name: 'user-agent-list',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('layout.menu.agents'),
      icon: 'RealEstateAgentOutlined',
      parent: 'user',
    },
  },
  {
    path: 'sign/self/list',
    name: 'my-sign',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('layout.menu.mySign'),
      icon: 'AssignmentIndOutlined',
      parent: 'user',
    },
  },
]
