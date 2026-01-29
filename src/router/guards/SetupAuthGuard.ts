import { userKeys } from '@/modules/user/application/hooks/useLoadUserInfo'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import type { Router } from 'vue-router'
import { difference } from 'lodash'
import { useQueryClient } from '@tanstack/vue-query'
import type { SignInResponse } from '@/modules/user/application/models'
import { userService } from '@/modules/user/application/service'
import type { AxiosError } from 'axios'
export function setupAuthGuards(router: Router) {
  router.beforeEach(async (to) => {
    const token = localStorage.getItem('ACCESS_TOKEN')
    const accountStore = useAccountStore()

    // ==============================================
    // 没有 Token 的情况
    // ==============================================
    if (!token) {
      // 如果是白名单（如登录页），放行
      if (_isUnAuthRoute(to.path)) {
        return true
      }
      // 否则，全部重定向到登录页
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    // ==============================================
    // 有 Token 的情况
    // ==============================================

    // 2.1 已登录还想去登录页？踢回 Dashboard
    // if (_isUnAuthRoute(to.path)) {
    //   return { name: 'dashboard' }
    // }

    // 2.2 数据预加载 (这是唯一产生阻塞的步骤)
    // 只有在数据还没加载过时才等待，后续路由跳转不会阻塞
    if (!accountStore.isLoadedData) {
      try {
        const queryClient = useQueryClient()
        // 这里 await 会导致路由暂停，你的全局进度条应该在这里转圈
        const data = await queryClient.ensureQueryData<
          SignInResponse,
          AxiosError<unknown>
        >({
          queryKey: userKeys.INFO(token),
          queryFn: () => userService.getUserInfoByToken(token),
          staleTime: 1000 * 60 * 5, // 5分钟内不重复请求
        })
        accountStore.login(data)
      } catch (error) {
        // Token 过期或网络错误，清除状态并去登录页
        console.error('Auth Guard Error:', error)
        accountStore.logout()
        return { name: 'login', query: { redirect: to.fullPath } }
      }
    }

    // ==============================================
    // 权限校验 (数据已存在)
    // ==============================================

    const requirePerms = to.meta.permissions
    const requireRoles = to.meta.roles

    // 如果该路由不需要任何权限，直接放行
    if (!requirePerms && !requireRoles) {
      return true
    }

    // 校验权限
    const hasPerm = permsInspect(
      accountStore.permissionList.map((item) => item.name),
      requirePerms,
    )
    if (hasPerm) return true

    // 校验角色
    const hasRole = permsInspect(
      accountStore.roleList.map((item) => item.name),
      requireRoles,
    )
    if (hasRole) return true

    // 既没权限也没角色 -> 403
    return { name: '403' }
  })
}
/**
 * 匹配auth路由
 * 注意查看@/router/index.ts中定义的auth路由是否以auth开头，如果不是则需要对正则表达式进行修改
 * @param path 路由路径
 * @returns {boolean}
 */
const _isAuthRoute = (path: string) => {
  return /^\/auth(\/|$)/.test(path)
}

const _isUnAuthRoute = (path: string) => {
  return /^\/unauth(\/|$)/.test(path)
}

/**
 * 权限检查
 * @param list 载有role code或者permission code的list
 * @param requireList 检查是否有所需的role code / permission code list
 * @returns void | 403forbidden路由参数
 */
const permsInspect = (list: Array<string>, requireList: Array<string> | undefined) => {
  if (!requireList) return
  if (difference(requireList, list).length > 0) {
    return { name: '403forbidden' }
  }
  return
}
