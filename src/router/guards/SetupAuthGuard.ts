import { useLoadUserInfo } from '@/hooks/account/useLoadUserInfo'
import { useAccountStore } from '@/stores/useAccountStore'
import { ref } from 'vue'
import type { Router } from 'vue-router'
import { difference } from 'lodash'
export function setupAuthGuards(router: Router) {
  const userInfoLoading = ref<boolean>(false)
  const token: string | null = localStorage.getItem('ACCESS_TOKEN')
  router.beforeEach(async (to) => {
    const accountStore = useAccountStore()
    const requirePerms: string[] | undefined = to.meta.permissions
    const requireRoles: string[] | undefined = to.meta.roles
    if (_isUnAuthRoute(to.path)) {
      if (token) {
        return { name: 'dashboard' }
      }
    }
    const userPermCheck = () => {
      const permCheck = permsInspect(
        accountStore.permissionList.map((item) => item.name),
        requirePerms,
      )
      if (permCheck) return permCheck
      const roleCheck = permsInspect(
        accountStore.roleList.map((item) => item.name),
        requireRoles,
      )
      if (roleCheck) return roleCheck
      return
    }
    if (accountStore.isAuth) {
      const result = userPermCheck()
      if (result) return result
    }
    if (token && !accountStore.isAuth) {
      await useLoadUserInfo(userInfoLoading)
      const result = userPermCheck()
      if (result) return result
    }
    if (_isAuthRoute(to.path)) {
      if (!token) {
        return { name: 'login' }
      }
    }
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
const permsInspect = (list: Array<string>, requireList: Array<string> | undefined) => {
  if (!requireList) return
  if (difference(requireList, list).length > 0) {
    return { name: '403forbidden' }
  }
  return
}
