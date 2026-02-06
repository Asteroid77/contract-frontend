<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AuthLayoutView from './auth/AuthLayoutView.vue'
import UnauthLayoutView from './unauth/UnauthLayoutView'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import { NSpin } from 'naive-ui'

const route = useRoute()
const accountStore = useAccountStore()

/**
 * 根据路由 meta.layout 动态选择布局
 * - 'unauth': 未认证布局（登录、注册等）
 * - 'auth': 认证后布局（仪表盘、业务页面等）
 * - 默认: 根据 requiresAuth 自动判断
 */
const currentLayout = computed(() => {
  const layout = route.meta.layout as 'auth' | 'unauth' | undefined

  // 如果明确指定了 layout，使用指定的
  if (layout === 'unauth') {
    return UnauthLayoutView
  }

  if (layout === 'auth') {
    return AuthLayoutView
  }

  // 否则根据 requiresAuth 自动判断
  const requiresAuth = route.meta.requiresAuth !== false
  return requiresAuth ? AuthLayoutView : UnauthLayoutView
})

/**
 * 是否显示加载状态
 * 当用户已登录但数据未加载完成时显示
 */
const isLoading = computed(() => {
  return accountStore.isAuth && !accountStore.isLoadedData
})
</script>

<template>
  <!-- 全局加载状态 -->
  <div v-if="isLoading" class="flex items-center justify-center h-screen">
    <n-spin size="large" />
  </div>

  <!-- 动态布局 -->
  <component v-else :is="currentLayout">
    <router-view />
  </component>
</template>
