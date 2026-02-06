<script setup lang="ts">
import { zhCN, dateZhCN, NConfigProvider, darkTheme } from 'naive-ui'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { useTheme } from '@/app/presentation/theme/hooks/useTheme'
import { computed } from 'vue'
import ErrorBoundary from '@/app/observability/components/ErrorBoundary'

const { isDark, activeThemeOverrides } = useTheme()
const naiveTheme = computed(() => (isDark.value ? darkTheme : null))
</script>
<template>
  <!-- 设置移动端字体以及默认bg样式 text-sm md:text-base text-text-main bg-bg-body -->
  <n-config-provider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme-overrides="activeThemeOverrides"
    :theme="naiveTheme"
    :class="'h-full'"
  >
    <!-- 全局错误边界：防止整个应用崩溃 -->
    <ErrorBoundary>
      <RouterView></RouterView>
    </ErrorBoundary>
  </n-config-provider>
  <VueQueryDevtools />
</template>
<style></style>
