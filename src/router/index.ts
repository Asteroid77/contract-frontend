import { createRouter, createWebHistory } from 'vue-router'
import { setupGuards } from './guards/setup'
import type { AppRouteRecord } from './types'

// ============================================================
// 类型导出
// ============================================================
export type { RouteName, AuthRouteName, UnauthRouteName, AppRouteMeta } from './types'
export { useTypedRouter, useTypedRoute, pushByName, replaceByName, routeTo } from './useTypedRouter'

// ============================================================
// 布局组件（首屏必需，不需要懒加载）
// ============================================================
import LayoutView from '@/views/LayoutView.vue'

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
  errorRoutes,
} from './modules'

// ============================================================
// 组合所有路由
// ============================================================

/**
 * 所有需要认证的路由
 * 由各业务模块路由组合而成
 */
export const authRoutes: AppRouteRecord[] = [
  ...dashboardRoutes,
  ...businessRoutes,
  ...userRoutes,
  ...manageRoutes,
  ...approvalRoutes,
]

/**
 * 所有路由（扁平化结构）
 *
 * 新架构特点：
 * 1. URL 扁平化：/dashboard 而不是 /auth/dashboard
 * 2. 通过 meta.layout 控制布局：'auth' | 'unauth'
 * 3. 通过 meta.requiresAuth 控制认证
 * 4. LayoutView 根据 meta 动态切换布局组件
 */
export const routes: AppRouteRecord[] = [
  {
    path: '/',
    name: 'layout',
    component: LayoutView,
    redirect: { name: 'dashboard' },
    children: [
      // 未认证路由（登录、注册等）
      ...unauthRoutes,

      // 需要认证的路由（业务页面）
      ...authRoutes,

      // 错误页面（必须放在最后）
      ...errorRoutes,
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

// 注册路由守卫
setupGuards(router)

export default router
