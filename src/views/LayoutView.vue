<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import UnauthLayoutView from './unauth/UnauthLayoutView'
import { NSpin } from 'naive-ui'

const AuthLayoutView = defineAsyncComponent(() =>
  import('./auth/AuthLayoutView.tsx').then((module) => module.default),
)

const route = useRoute()

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
</script>

<template>
  <!-- 动态布局 -->
  <Suspense>
    <component :is="currentLayout">
      <router-view />
    </component>
    <template #fallback>
      <div class="flex items-center justify-center h-screen">
        <n-spin size="large" />
      </div>
    </template>
  </Suspense>
</template>
