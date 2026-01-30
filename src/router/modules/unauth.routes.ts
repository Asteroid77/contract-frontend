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
 */
export const unauthRoutes: AppRouteRecord[] = [
  {
    path: 'login',
    name: 'login',
    component: LoginView,
    meta: {
      name: $t('auth.login.noAccount'),
    },
  },
  {
    path: 'register',
    name: 'register',
    component: () => import('@/views/unauth/RegisterView'),
    meta: {
      name: $t('auth.register.submit'),
    },
  },
  {
    path: 'password-recovery',
    name: 'password-recovery',
    component: () => import('@/views/unauth/PasswordRecoveryView'),
    meta: {
      name: $t('layout.menu.recovery'),
    },
  },
  {
    path: 'oauth2/callback',
    name: 'oauth2-callback',
    component: () => import('@/views/unauth/Oauth2CallbackView.vue'),
    meta: {
      name: $t('auth.oauth.callback'),
    },
  },
  {
    path: 'sign/preview/attachments',
    name: 'approval-preview-attachments',
    component: () => import('@/views/unauth/PreviewAttachments.tsx'),
    props: (route: RouteLocation) => ({
      type: toNumberOrNull(route.query.type),
      id: toNumberOrNull(route.query.id),
    }),
  },
]
