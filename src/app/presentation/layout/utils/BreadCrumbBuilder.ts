import type { RouteRecordRaw } from 'vue-router'
/**
 * 查找对象的所有父对象链
 * @param obj 需要查找父对象的对象
 * @returns 包含所有父对象的数组，从直接父对象到最顶层父对象排序
 */
export function findAllParents(
  name: string,
  routeInfoMap: { [key: string]: RouteRecordRaw },
  result: RouteRecordRaw[] = [],
): RouteRecordRaw[] {
  if (routeInfoMap[name] && routeInfoMap[name].meta?.parent) {
    const parentName = routeInfoMap[name].meta?.parent as string
    const parentInfo = routeInfoMap[parentName]

    if (parentInfo) {
      // 添加父路由到结果数组
      result.push(parentInfo)

      // 递归查找父路由的父路由，并返回结果
      return findAllParents(parentName, routeInfoMap, result)
    }
  }

  // 返回最终结果
  return result
}
