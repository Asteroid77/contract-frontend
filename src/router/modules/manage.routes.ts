import type { AppRouteRecord } from '../types'
import type { RouteLocation } from 'vue-router'
import DashboardView from '@/views/auth/DashboardView.vue'

const toNumberOrNull = (val: unknown): number | null => {
  if (val === null || val === undefined || val === '') return null
  const num = Number(val)
  return Number.isNaN(num) ? null : num
}

/**
 * 管理中心相关路由
 */
export const manageRoutes: AppRouteRecord[] = [
  {
    path: '/manage',
    name: 'manage',
    component: DashboardView,
    meta: {
      name: 'layout.menu.manage',
      icon: 'nav.manage',
      isTransition: true,
    },
  },
  {
    path: '/manage/user/list',
    name: 'manage-user-list',
    component: () => import('@/views/auth/ManageUserListView'),
    meta: {
      name: 'layout.menu.users',
      icon: 'user.manage',
      parent: 'manage',
      ability: {
        action: 'read',
        subject: 'User',
      },
    },
  },
  {
    path: '/manage/user/:userId/detail',
    name: 'manage-user-detail',
    component: () => import('@/views/auth/ManageUserDetailView'),
    meta: {
      name: 'layout.menu.users',
      icon: 'user.manage',
      parent: 'manage-user-list',
      hideInMenu: true,
      ability: {
        action: 'read',
        subject: 'User',
      },
    },
    props: (route: RouteLocation) => ({
      userId: toNumberOrNull(route.params.userId),
      mode: 'detail',
    }),
  },
  {
    path: '/manage/user/:userId/edit',
    name: 'manage-user-edit',
    component: () => import('@/views/auth/ManageUserDetailView'),
    meta: {
      name: 'layout.menu.users',
      icon: 'user.manage',
      parent: 'manage-user-list',
      hideInMenu: true,
      ability: {
        action: 'update',
        subject: 'User',
      },
    },
    props: (route: RouteLocation) => ({
      userId: toNumberOrNull(route.params.userId),
      mode: 'edit',
    }),
  },
]
