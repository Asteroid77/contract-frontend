import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    // 如果设置，则会根据用户信息判断permission
    permissions?: string[]
    // 用于面包屑以及菜单展示路由名称
    name?: string
    // 用于面包屑以及菜单展示路由图标
    icon?: string
    // 是否在菜单中隐藏
    hideInMenu?: boolean
    // 是否在面包屑中隐藏
    hideInBreadcrumb?: boolean
    // 父菜单path
    parent?: string
    // 排序权重
    orderNo?: number
    // 是否为过渡菜单（没有实际路由，只作为菜单分组）
    isTransition?: boolean
  }
}

export {}
