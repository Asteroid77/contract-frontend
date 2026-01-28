import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import dexie from '@/_utils/dexie'
import type { SignInResponse } from '@/types/account'
export const useAccountStore = defineStore('account', () => {
  /**
   * 用户登录凭证
   */
  const token = ref<SignInResponse['token'] | null>(localStorage.getItem('ACCESS_TOKEN'))

  /**
   * 总信息
   */
  const account = ref<SignInResponse>()

  /**
   * 用户信息
   */
  const user = ref<SignInResponse['user']>({
    // 主键
    id: 0,
    // 姓名
    name: '',
    // 手机
    phone: '',
    // 是否通过审批
    active: '1',
    // 是否逻辑删除
    isDeleted: 0,
    // 所属平台
    platform: 'NATIVE',
  })

  /**
   * 用户详情
   */
  const profile = ref<SignInResponse['profile']>({
    registerType: '1',
    bankAccount: '',
    bankName: '',
    name: '',
    pca: '',
    userId: 0,
    identity: '',
    discriminator: 0,
    createdTime: '',
    updatedTime: '',
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
   * 用户是否已加载信息
   */
  const isLoadedData = ref<boolean>(false)
  /**
   * 用户语言
   */
  const language = ref<NavigatorLanguage['language']>(window.navigator.language)

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
    profile.value = data.profile
    roleList.value = data.roleList
    permissionList.value = data.permissionList
    account.value = data
    localStorage.setItem('ACCESS_TOKEN', data.token)
    dexie.userinfo.add(data)
    isLoadedData.value = true
  }

  /**
   * 判断是否拥有指定角色
   * @returns (roleCode: string) => boolean
   */
  function hasRole(roleCode: string) {
    return roleList.value.some((role) => role.name === roleCode)
  }
  /**
   * 判断是否拥有指定权限
   * @returns (permissionCode: string) => boolean
   */
  function hasPermission(permissionCode: string) {
    return permissionList.value.some((permission) => permission.name === permissionCode)
  }

  /**
   * 判断当前登录用户是否是指定ID的所有者
   * @returns (ownerId: number | undefined) => boolean
   */
  function isOwner(ownerId: number | undefined) {
    // 如果用户未登录或 ownerId 无效，则不是所有者
    if (!user.value.id || ownerId === undefined) {
      return false
    }
    // 比较当前用户ID和传入的所有者ID
    return user.value.id === ownerId
  }

  function $reset() {
    if (token.value) dexie.userinfo.delete(token.value)
    localStorage.removeItem('ACCESS_TOKEN')
    token.value = ''
    user.value = {
      // 主键
      id: 0,
      // 姓名
      name: '',
      // 手机
      phone: '',
      // 是否通过审批
      active: '1',
      // 是否逻辑删除
      isDeleted: 0,
      // 所属平台
      platform: 'NATIVE',
    }
    profile.value = {
      registerType: '1',
      bankAccount: '',
      bankName: '',
      name: '',
      pca: '',
      userId: 0,
      identity: '',
      discriminator: 0,
      createdTime: '',
      updatedTime: '',
    }
    roleList.value = []
    permissionList.value = []
    account.value = {
      user: user.value,
      profile: profile.value,
      roleList: [],
      permissionList: [],
      token: '',
    }
  }

  return {
    token,
    roleList,
    permissionList,
    user,
    isAuth,
    isLoadedData,
    language,
    profile,
    account,
    logout,
    login,
    hasPermission,
    hasRole,
    isOwner,
  }
})
