<script setup lang="ts">
import 'vfonts/FiraCode.css'
import { useThemeStore } from './stores/useThemeStore'
import { zhCN, dateZhCN, NConfigProvider } from 'naive-ui'
const themeOverrides = useThemeStore().themeOverrides
;(function themeInitiate() {
  // 启用主题编辑器并预设主题，主题编辑器默认会读取localStorage中的naive-ui-theme-overrides项的内容作为设置。
  if (!localStorage.getItem('naive-ui-theme-overrides')) {
    localStorage.setItem('naive-ui-theme-overrides', JSON.stringify(themeOverrides))
  }
})()
</script>
<template>
  <n-config-provider
    class="h-full"
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme-overrides="themeOverrides"
  >
    <RouterView></RouterView>
  </n-config-provider>
</template>
<style></style>
