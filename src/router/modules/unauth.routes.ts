import { $t } from '@/_utils/i18n'
import type { AppRouteRecord } from '../types'
import type { RouteLocation } from 'vue-router'
import LoginView from '@/views/unauth/LoginView'

// 工具函数
const toNumberOrNull = (val: unknown): number | null => {
  if (val === null || val === undefined || val === '') return null
  const num = Number(val)
  return isNaN(num) ? null : num
}

/**
 * 未认证路由
 * 包括：登录、注册、密码找回、OAuth2 回调等
 *
 * 特点：
 * - requiresAuth: false（不需要登录）
 * - layout: 'unauth'（使用未认证布局）
 * - 扁平化路径：/login 而不是 /unauth/login
 */
export const unauthRoutes: AppRouteRecord[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      name: $t('auth.login.noAccount'),
      requiresAuth: false,
      layout: 'unauth',
    },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/unauth/RegisterView'),
    meta: {
      name: $t('auth.register.submit'),
      requiresAuth: false,
      layout: 'unauth',
    },
  },
  {
    path: '/password-recovery',
    name: 'password-recovery',
    component: () => import('@/views/unauth/PasswordRecoveryView'),
    meta: {
      name: $t('layout.menu.recovery'),
      requiresAuth: false,
      layout: 'unauth',
    },
  },
  {
    path: '/oauth2/callback',
    name: 'oauth2-callback',
    component: () => import('@/views/unauth/Oauth2CallbackView.vue'),
    meta: {
      name: $t('auth.oauth.callback'),
      requiresAuth: false,
      layout: 'unauth',
    },
  },
  {
    path: '/sign/preview/attachments',
    name: 'approval-preview-attachments',
    component: () => import('@/views/unauth/PreviewAttachments.tsx'),
    props: (route: RouteLocation) => ({
      type: toNumberOrNull(route.query.type),
      id: toNumberOrNull(route.query.id),
    }),
    meta: {
      requiresAuth: false,
      layout: 'unauth',
    },
  },
]
