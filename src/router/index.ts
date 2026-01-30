import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupGuards } from './guards/setup'

// ============================================================
// 类型导出
// ============================================================
export type { RouteName, AuthRouteName, UnauthRouteName, AppRouteMeta } from './types'
export { useTypedRouter, useTypedRoute, pushByName, replaceByName, routeTo } from './useTypedRouter'

// ============================================================
// 直接导入（首屏必需，不需要懒加载）
// ============================================================
import LayoutView from '@/views/LayoutView.vue'
import UnauthLayoutView from '@/views/unauth/UnauthLayoutView'
import AuthLayoutView from '@/views/auth/AuthLayoutView.vue'

// ============================================================
// 模块化路由导入
// ============================================================
import {
  dashboardRoutes,
  businessRoutes,
  userRoutes,
  manageRoutes,
  approvalRoutes,
  unauthRoutes,
} from './modules'

// ============================================================
// 组合认证后路由
// ============================================================

/**
 * 所有需要认证的路由
 * 由各业务模块路由组合而成
 */
export const authRoutes: RouteRecordRaw[] = [
  ...dashboardRoutes,
  ...businessRoutes,
  ...userRoutes,
  ...manageRoutes,
  ...approvalRoutes,
]

// ============================================================
// 主路由配置
// ============================================================

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'layout',
    component: LayoutView,
    children: [
      {
        name: 'unauth-layout-view',
        path: 'unauth',
        redirect: { name: 'login' },
        component: UnauthLayoutView,
        children: unauthRoutes as RouteRecordRaw[],
      },
      {
        path: 'auth',
        name: 'auth',
        redirect: { name: 'dashboard' },
        component: AuthLayoutView,
        children: authRoutes,
      },
    ],
  },
]

// ============================================================
// 创建路由实例
// ============================================================

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

setupGuards(router)

export default router
