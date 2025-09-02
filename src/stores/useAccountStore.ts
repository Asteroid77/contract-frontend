import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { SignInResponse } from '@/types/account'
import dexie from '@/_utils/dexie'
export const useAccountStore = defineStore('account', () => {
  /**
   * 用户登录凭证
   */
  const token = ref<SignInResponse['token']>()

  /**
   * 用户信息
   */
  const user = ref<SignInResponse['user']>({
    // 主键
    id: '',
    // 姓名
    name: '',
    // 手机
    phone: '',
    // 是否通过审批
    active: '1',
    // 是否逻辑删除
    isDeleted: 0,
  })

  /**
   * 用户角色列表
   */
  const roleList = ref<SignInResponse['roleList']>([])

  /**
   * 用户权限列表
   */
  const permissionList = ref<SignInResponse['permissionList']>([])

  /**
   * 用户是否登录
   */
  const isAuth = computed(() => !!token.value)

  /**
   * 退出登录
   * @description 重置account并路由导航至初始页，由路由守卫逻辑导航回login页
   */
  function logout() {
    $reset()
  }

  function login(data: SignInResponse) {
    token.value = data.token
    user.value = data.user
    roleList.value = data.roleList
    permissionList.value = data.permissionList
    localStorage.setItem('ACCESS_TOKEN', data.token)
    dexie.userinfo.add(data)
  }

  function $reset() {
    if (token.value) dexie.userinfo.delete(token.value)
    localStorage.removeItem('ACCESS_TOKEN')
    token.value = ''
    user.value = {
      // 主键
      id: '',
      // 姓名
      name: '',
      // 手机
      phone: '',
      // 是否通过审批
      active: '1',
      // 是否逻辑删除
      isDeleted: 0,
    }
    roleList.value = []
    permissionList.value = []
  }

  return { token, roleList, permissionList, user, isAuth, logout, login }
})
