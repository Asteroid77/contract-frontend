<script setup lang="ts">
import { zhCN, dateZhCN, enUS, dateEnUS, NConfigProvider, darkTheme } from 'naive-ui'
import { VueQueryDevtools } from '@tanstack/vue-query-devtools'
import { useTheme } from '@/app/presentation/theme/hooks/useTheme'
import { computed } from 'vue'
import ErrorBoundary from '@/app/observability/components/ErrorBoundary'
import { language } from '@/_utils/i18n'

const { isDark, activeThemeOverrides } = useTheme()
const naiveTheme = computed(() => (isDark.value ? darkTheme : null))
const naiveLocale = computed(() => (language.value === 'en' ? enUS : zhCN))
const naiveDateLocale = computed(() => (language.value === 'en' ? dateEnUS : dateZhCN))
</script>
<template>
  <!-- 设置移动端字体以及默认bg样式 text-sm md:text-base text-text-main bg-bg-body -->
  <n-config-provider
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
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
