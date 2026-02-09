import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import dexie from '@/app/infrastructure/storage/dexie'
import type { SignInResponse } from '@/modules/user/application/models'
import { STORAGE_KEYS } from '@/constants/storage'
import { updateAbility, clearAbility } from '@/modules/access/application/ability'
import { clearAuthTokens, setAuthTokens } from '@/modules/access/application/token-manager'

export const useAccountStore = defineStore('account', () => {
  /**
   * 用户登录凭证
   */
  const token = ref<SignInResponse['token'] | null>(localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN))

  /**
   * 用户刷新凭证（记住我场景）
   */
  const refreshToken = ref<SignInResponse['refreshToken'] | null>(
    localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  )

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
  const profile = ref<SignInResponse['profile']>(null)

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
    clearAbility() // 清空 CASL 权限
    $reset()
  }

  function updateTokens(accessToken: string, nextRefreshToken?: string) {
    token.value = accessToken
    refreshToken.value = nextRefreshToken ?? null
    setAuthTokens({
      accessToken,
      refreshToken: nextRefreshToken,
    })
  }

  function login(data: SignInResponse) {
    updateTokens(data.token, data.refreshToken)
    user.value = data.user
    profile.value = data.profile
    roleList.value = data.roleList
    permissionList.value = data.permissionList
    account.value = data
    dexie.userinfo.add(data)
    isLoadedData.value = true

    // 更新 CASL 权限
    updateAbility(data.permissionList, data.roleList)
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
    clearAuthTokens()
    token.value = null
    refreshToken.value = null
    isLoadedData.value = false
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
    profile.value = null
    roleList.value = []
    permissionList.value = []
    account.value = {
      user: user.value,
      profile: profile.value,
      roleList: [],
      permissionList: [],
      token: '',
      refreshToken: undefined,
    }
  }

  return {
    token,
    refreshToken,
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
    updateTokens,
    hasPermission,
    hasRole,
    isOwner,
  }
})
