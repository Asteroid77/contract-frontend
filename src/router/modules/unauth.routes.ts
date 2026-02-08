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
    path: '/unauth/login',
    redirect: { name: 'login' },
    meta: {
      requiresAuth: false,
      layout: 'unauth',
    },
  },
  {
    path: '/unauth/register',
    redirect: { name: 'register' },
    meta: {
      requiresAuth: false,
      layout: 'unauth',
    },
  },
  {
    path: '/unauth/password-recovery',
    redirect: { name: 'password-recovery' },
    meta: {
      requiresAuth: false,
      layout: 'unauth',
    },
  },
  {
    path: '/unauth/oauth2/callback',
    redirect: (route) => ({ name: 'oauth2-callback', query: route.query }),
    meta: {
      requiresAuth: false,
      layout: 'unauth',
    },
  },
  {
    path: '/forgot-password',
    redirect: { name: 'password-recovery' },
    meta: {
      requiresAuth: false,
      layout: 'unauth',
    },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      name: 'layout.menu.login',
      requiresAuth: false,
      layout: 'unauth',
    },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/unauth/RegisterView'),
    meta: {
      name: 'layout.menu.register',
      requiresAuth: false,
      layout: 'unauth',
    },
  },
  {
    path: '/password-recovery',
    name: 'password-recovery',
    component: () => import('@/views/unauth/PasswordRecoveryView'),
    meta: {
      name: 'layout.menu.recovery',
      requiresAuth: false,
      layout: 'unauth',
    },
  },
  {
    path: '/oauth2/callback',
    name: 'oauth2-callback',
    component: () => import('@/views/unauth/Oauth2CallbackView.vue'),
    meta: {
      name: 'auth.oauth.callback',
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
