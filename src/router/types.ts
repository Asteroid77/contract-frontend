import type { RouteRecordRaw, RouteLocationRaw, RouteParamsRaw, LocationQuery } from 'vue-router'

// ============================================================
// 路由元信息类型
// ============================================================

/**
 * 应用路由的 meta 类型定义
 */
export interface AppRouteMeta {
  /** 路由显示名称 */
  name?: string
  /** 图标名称 */
  icon?: string
  /** 父级路由名（用于面包屑/菜单层级） */
  parent?: string
  /** 是否为过渡路由（仅作为菜单分组，点击后不跳转） */
  isTransition?: boolean
  /** 是否在菜单中隐藏 */
  hideInMenu?: boolean
}

// ============================================================
// 路由记录类型
// ============================================================

/**
 * 应用路由记录类型（带类型化 meta）
 * 使用 RouteRecordRaw 保持与 vue-router 完全兼容
 */
export type AppRouteRecord = RouteRecordRaw & {
  meta?: AppRouteMeta
}

// ============================================================
// 路由名称联合类型
// ============================================================

/**
 * 所有认证后路由的名称
 */
export type AuthRouteName =
  | 'dashboard'
  | 'document'
  // 业务管理
  | 'business'
  | 'invitation'
  | 'sign'
  | 'sign-page'
  | 'sign-result'
  // 用户中心
  | 'user'
  | 'user-additional-info'
  | 'user-agent-list'
  | 'my-sign'
  // 管理中心
  | 'manage'
  | 'manage-user-list'
  // 审批中心
  | 'approval'
  | 'approval-my-approval-instance-page'
  | 'approval-instance-detail'
  | 'approval-my-task-list'
  | 'approval-process-list'
  | 'approval-node-list'
  | 'approval-task-list'

/**
 * 所有未认证路由的名称
 */
export type UnauthRouteName =
  | 'login'
  | 'register'
  | 'password-recovery'
  | 'oauth2-callback'
  | 'approval-preview-attachments'

/**
 * 布局路由名称
 */
export type LayoutRouteName = 'layout' | 'unauth-layout-view' | 'auth'

/**
 * 所有路由名称的联合类型
 */
export type RouteName = AuthRouteName | UnauthRouteName | LayoutRouteName

// ============================================================
// 类型安全的路由位置
// ============================================================

/**
 * 命名路由的类型安全位置
 */
export interface TypedRouteLocationByName {
  name: RouteName
  params?: RouteParamsRaw
  query?: LocationQuery
}

/**
 * 类型安全的路由位置（支持命名路由和路径路由）
 */
export type TypedRouteLocation = TypedRouteLocationByName | Omit<RouteLocationRaw, 'name'>

// ============================================================
// 路由参数类型映射
// ============================================================

/**
 * 需要参数的路由及其参数类型
 * 用于在 router.push 时提供类型提示
 */
export interface RouteParamsMap {
  sign: { id?: number | null }
  'sign-result': { status?: number | null; id?: number | null }
  'approval-preview-attachments': { type?: number | null; id?: number | null }
}

/**
 * 辅助类型：获取路由的参数类型
 */
export type RouteParams<T extends RouteName> = T extends keyof RouteParamsMap
  ? RouteParamsMap[T]
  : Record<string, never>
