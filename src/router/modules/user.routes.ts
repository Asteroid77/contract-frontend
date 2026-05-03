import type { AppRouteRecord } from '../types'
import DashboardView from '@/views/auth/DashboardView.vue'

/**
 * 用户中心相关路由
 */
export const userRoutes: AppRouteRecord[] = [
  {
    path: '/user',
    name: 'user',
    component: DashboardView,
    meta: {
      name: 'layout.menu.profile',
      icon: 'nav.user',
      isTransition: true,
    },
  },
  {
    path: '/user/profile',
    name: 'user-profile',
    component: () => import('@/views/auth/UserProfileView.vue'),
    meta: {
      name: 'layout.menu.profile',
      icon: 'user.profile',
      parent: 'user',
      hideInMenu: true,
    },
  },
  {
    path: '/user/additional-info',
    name: 'user-additional-info',
    component: () => import('@/views/auth/UserAdditionalInfoView.vue'),
    meta: {
      name: 'layout.menu.additional',
      icon: 'user.profile',
      parent: 'user',
      hideInMenu: true,
    },
  },
  {
    path: '/user/additional-info/pending',
    name: 'user-additional-info-pending',
    component: () => import('@/views/auth/UserAdditionalInfoPendingView.vue'),
    meta: {
      name: 'layout.menu.additional',
      icon: 'user.profile',
      parent: 'user-additional-info',
      hideInMenu: true,
    },
  },
  {
    path: '/user/settings',
    name: 'user-settings',
    component: () => import('@/views/auth/UserSettingsView.vue'),
    meta: {
      name: 'layout.menu.settings',
      icon: 'nav.settings',
      parent: 'user',
      hideInMenu: true,
    },
  },
  {
    path: '/user/agent/list',
    name: 'user-agent-list',
    component: DashboardView,
    meta: {
      name: 'layout.menu.agents',
      icon: 'user.agents',
      parent: 'user',
    },
  },
  {
    path: '/sign/self/list',
    name: 'my-sign',
    component: DashboardView,
    meta: {
      name: 'layout.menu.mySign',
      icon: 'agreement.selfSign',
      parent: 'user',
    },
  },
]
