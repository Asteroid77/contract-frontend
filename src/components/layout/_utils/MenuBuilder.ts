import { RouterLink, type RouteLocationGeneric, type RouteRecordRaw } from 'vue-router'
import { h } from 'vue'
import { NEllipsis, type MenuOption } from 'naive-ui'
import { renderIcon } from '@/_utils/widget/renderIcon'
import { routeIcons as icons } from '@/components/layout/constant/RouteIcons'

export type IconNames = keyof typeof icons
/**
 * 将路由配置转换为Naive UI菜单数据结构
 * @param routes 路由配置数组
 * @returns Naive UI菜单数据结构
 */
export function convertRoutesToMenuItems(routes: RouteRecordRaw[]) {
  // 创建一个映射来存储所有菜单项
  const menuMap = new Map()

  // 第一步：创建所有菜单项
  routes.forEach((route) => {
    // 跳过没有meta或者meta.name或者使用hideInMenu的路由
    if (!route.meta || !route.meta.name || route.meta.hideInMenu) return

    // 创建菜单项
    const menuItem: MenuOption = {
      key: route.name as string,
      label: () =>
        route.meta?.isTransition
          ? h(NEllipsis, null, { default: () => route.meta?.name })
          : h(
              RouterLink,
              {
                to: {
                  name: route.name,
                },
              },
              { default: () => h(NEllipsis, null, { default: () => route.meta?.name }) },
            ),
      children: [],
      // 保存原始路由信息，用于后续处理
      _rawRoute: route,
    }
    if (route.meta.icon) {
      menuItem['icon'] = renderIcon(resolveIcon(route.meta.icon as keyof typeof icons))
    }

    menuMap.set(route.name, menuItem)
  })

  // 第二步：构建菜单树结构
  const rootMenuItems: MenuOption[] = []

  menuMap.forEach((menuItem: MenuOption) => {
    const route = menuItem._rawRoute as RouteLocationGeneric

    // 如果有parent属性，将其添加到父菜单的children中
    if (route.meta.parent && menuMap.has(route.meta.parent)) {
      const parentMenuItem = menuMap.get(route.meta.parent)
      parentMenuItem.children.push(menuItem)
    } else {
      // 没有parent属性，作为根菜单项
      rootMenuItems.push(menuItem)
    }

    // 删除临时属性
    delete menuItem._rawRoute
  })

  // 第三步：处理过渡菜单（没有实际路由，只作为菜单分组）
  menuMap.forEach((menuItem) => {
    // 如果是过渡菜单且没有子菜单，从根菜单中移除
    if (menuItem._rawRoute?.meta?.isTransition && menuItem.children.length === 0) {
      const index = rootMenuItems.findIndex((item) => item.key === menuItem.key)
      if (index !== -1) {
        rootMenuItems.splice(index, 1)
      }
    }

    // 删除临时属性
    delete menuItem._rawRoute
  })

  // 第四步：清理空的children数组
  const cleanupEmptyChildren = (items: MenuOption[]) => {
    return items.map((item) => {
      if (item.children && item.children.length === 0) {
        delete item['children']
        return item
      }

      if (item.children && item.children.length > 0) {
        item.children = cleanupEmptyChildren(item.children)
      }

      return item
    })
  }

  return cleanupEmptyChildren(rootMenuItems)
}

/**
 * 解析图标组件
 * @param icon 图标名称
 * @returns 图标组件
 */
export function resolveIcon(icon: keyof typeof icons) {
  return icons[icon] || null
}
