<script setup lang="ts">
import clsx from 'clsx'
import LayoutSideBar from './LayoutSideBar.vue'
import { NScrollbar, NCard } from 'naive-ui'
import AuthHeader from '@/app/presentation/layout/auth/AuthHeader.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { match } from 'ts-pattern'
import ErrorBoundary from '@/app/observability/components/ErrorBoundary'
import { $t } from '@/_utils/i18n'

const route = useRoute()

// 判断是否需要居中布局（如结果页）
const needsCentering = computed(() => {
  return match(route.name)
    .when(
      (r) => r?.toString().includes('result'),
      () => true,
    )
    .otherwise(() => false)
})

// 内容容器的样式类
const contentClasses = computed(() => {
  return clsx(
    'w-full',
    'h-full',
    needsCentering.value && 'flex items-center justify-center',
  )
})

// 翻译页面标题
const pageTitle = computed(() => {
  return route.meta.name ? $t(route.meta.name as any) : ''
})
</script>
<template>
  <div :class="clsx('zw-layout', 'w-full', 'h-full', 'flex')">
    <LayoutSideBar></LayoutSideBar>
    <div :class="clsx('zw-middle', 'grow', 'w-full', 'flex', 'flex-col', 'min-h-0')">
      <AuthHeader></AuthHeader>

      <!-- 使用统一的结构，通过条件渲染决定是否使用滚动容器 -->
      <component
        :is="needsCentering ? 'div' : NScrollbar"
        :class="clsx('zw-content', 'grow', needsCentering ? '' : 'p-content')"
        :trigger="needsCentering ? undefined : 'none'"
      >
        <n-card :title="pageTitle" :class="clsx('w-full', 'h-full')">
          <div :class="contentClasses">
            <!-- 页面级错误边界：保护主内容区 -->
            <ErrorBoundary>
              <router-view v-slot="{ Component }">
                <div class="w-full">
                  <component :is="Component"></component>
                </div>
              </router-view>
            </ErrorBoundary>
          </div>
        </n-card>
      </component>
    </div>
  </div>
</template>
