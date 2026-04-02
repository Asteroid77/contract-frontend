import {
  useRouter as useVueRouter,
  useRoute as useVueRoute,
  type Router,
  type RouteLocationNormalizedLoadedGeneric,
  type LocationQuery,
} from 'vue-router'
import type { RouteName, RouteParams, TypedRouteLocationByName } from './types'

// ============================================================
// 类型安全的路由 Composable
// ============================================================

/**
 * 类型安全的路由器接口
 */
export interface TypedRouter extends Omit<Router, 'push' | 'replace'> {
  /**
   * 类型安全的 push 方法
   */
  push: (to: TypedRouteLocationByName | string) => ReturnType<Router['push']>

  /**
   * 类型安全的 replace 方法
   */
  replace: (to: TypedRouteLocationByName | string) => ReturnType<Router['replace']>
}

/**
 * 获取类型安全的路由器
 *
 * @example
 * ```ts
 * const router = useTypedRouter()
 * // ✅ 有自动补全和类型检查
 * router.push({ name: 'dashboard' })
 * // ❌ TypeScript 会报错
 * router.push({ name: 'non-existent-route' })
 * ```
 */
export function useTypedRouter(): TypedRouter {
  return useVueRouter() as unknown as TypedRouter
}

/**
 * 获取当前路由（与 useRoute 相同，仅为命名一致性）
 */
export function useTypedRoute(): RouteLocationNormalizedLoadedGeneric {
  return useVueRoute()
}

// ============================================================
// 便捷导航函数
// ============================================================

/**
 * 通过路由名称进行导航
 *
 * @param name 路由名称（有自动补全）
 * @param options 可选的 query 参数
 *
 * @example
 * ```ts
 * // 简单导航
 * await pushByName('dashboard')
 *
 * // 带 query 参数
 * await pushByName('sign', { id: 123 })
 * ```
 */
export async function pushByName<T extends RouteName>(
  name: T,
  query?: T extends keyof RouteParams<T> ? RouteParams<T> : LocationQuery,
): Promise<void> {
  const router = useVueRouter()
  await router.push({ name, query: query as LocationQuery })
}

/**
 * 通过路由名称进行替换导航（不产生历史记录）
 *
 * @param name 路由名称（有自动补全）
 * @param options 可选的 query 参数
 */
export async function replaceByName<T extends RouteName>(
  name: T,
  query?: T extends keyof RouteParams<T> ? RouteParams<T> : LocationQuery,
): Promise<void> {
  const router = useVueRouter()
  await router.replace({ name, query: query as LocationQuery })
}

// ============================================================
// 辅助函数
// ============================================================

/**
 * 创建类型安全的路由位置对象
 *
 * @param name 路由名称
 * @param query 可选的 query 参数
 *
 * @example
 * ```ts
 * // 用于 router-link
 * <router-link :to="routeTo('sign', { id: 123 })">签署</router-link>
 * ```
 */
export function routeTo<T extends RouteName>(
  name: T,
  query?: LocationQuery,
): TypedRouteLocationByName {
  return { name, query }
}

/**
 * 检查当前路由是否匹配指定名称
 *
 * @param name 路由名称
 */
export function isCurrentRoute(name: RouteName): boolean {
  const route = useVueRoute()
  return route.name === name
}

/**
 * 检查当前路由是否在指定路由或其子路由下
 * 用于菜单高亮等场景
 *
 * @param name 路由名称
 */
export function isUnderRoute(name: RouteName): boolean {
  const route = useVueRoute()
  // 检查当前路由名或路由的 matched 中是否包含目标
  if (route.name === name) return true
  return route.matched.some((r) => r.name === name)
}
