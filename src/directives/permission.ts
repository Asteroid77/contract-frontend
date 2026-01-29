import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import type { Directive, DirectiveBinding } from 'vue'

// 确保在 setup 之外使用 pinia store
let accountStore: ReturnType<typeof useAccountStore>

const permissionDirective: Directive = {
  // 在元素挂载时执行
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    // 首次挂载时初始化 store
    if (!accountStore) {
      accountStore = useAccountStore()
    }

    checkPermission(el, binding)
  },
  // 在组件更新时，如果权限有变化，也需要重新检查
  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    checkPermission(el, binding)
  },
}

function checkPermission(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
  const { value, arg } = binding

  // 如果没有传递任何值，则不进行任何操作
  if (!value) {
    return
  }

  let hasAuth = false

  // 判断是检查角色还是权限
  // 用法: v-permission:role="'admin'"
  if (arg === 'role') {
    hasAuth = accountStore.hasRole(value as string)
  } else {
    // 默认检查权限
    // 用法: v-permission="'article:create'"
    // 或者 v-permission="['article:create', 'article:publish']" (需要同时拥有)
    const requiredPermissions = Array.isArray(value) ? value : [value]
    hasAuth = requiredPermissions.every((perm) => accountStore.hasPermission(perm))
  }

  // 如果没有权限，则从DOM中移除该元素
  if (!hasAuth) {
    // 使用 el.remove() 更现代、更简洁
    el.remove()
  }
}

export default permissionDirective
