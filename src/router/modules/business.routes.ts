import { $t } from '@/_utils/i18n'
import type { AppRouteRecord } from '../types'
import type { RouteLocation } from 'vue-router'

// 工具函数
const toNumberOrNull = (val: unknown): number | null => {
  if (val === null || val === undefined || val === '') return null
  const num = Number(val)
  return isNaN(num) ? null : num
}

/**
 * 业务管理相关路由
 * 包括：邀请函、合同签署等
 */
export const businessRoutes: AppRouteRecord[] = [
  {
    path: 'business',
    name: 'business',
    component: () => import('@/views/auth/DashboardView.vue'),
    meta: {
      name: $t('layout.menu.business'),
      icon: 'BusinessCenterOutlined',
      isTransition: true,
    },
  },
  {
    path: 'invitation',
    name: 'invitation',
    component: () => import('@/views/auth/InvitationPageView.vue'),
    meta: {
      name: $t('layout.menu.invitation'),
      icon: 'InsertInvitationOutlined',
      parent: 'business',
    },
  },
  {
    path: 'sign',
    name: 'sign',
    component: () => import('@/views/auth/ServiceAgreementDetailView'),
    meta: {
      name: $t('layout.menu.sign'),
      icon: 'icon-qianyue',
      parent: 'sign-page',
    },
    props: (route: RouteLocation) => ({
      id: toNumberOrNull(route.query.id),
    }),
  },
  {
    path: 'sign/page',
    name: 'sign-page',
    component: () => import('@/views/auth/ServiceAgreementPageView'),
    meta: {
      name: $t('layout.menu.signList'),
      icon: 'icon-qianyueliebiao',
      parent: 'business',
    },
  },
  {
    path: 'sign/result',
    name: 'sign-result',
    component: () => import('@/views/auth/SignResultView'),
    meta: {
      name: $t('layout.menu.signResult'),
      icon: 'icon-qianyueliebiao',
      parent: 'sign',
      hideInMenu: true,
    },
    props: (route: RouteLocation) => ({
      status: toNumberOrNull(route.query.status),
      id: toNumberOrNull(route.query.id),
    }),
  },
]
