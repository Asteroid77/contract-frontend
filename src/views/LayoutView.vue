<script setup lang="ts">
import clsx from 'clsx'
import { useThemeVars } from 'naive-ui'
import { computed } from 'vue'
/**
 * promote naive private css to global style tag
 */
const themeVars = useThemeVars()
const cssVariables = computed(() => {
  if (!themeVars.value) return ''
  const vars = Object.entries(themeVars.value)
    .map(([key, value]) => {
      const cssVarName = `--n-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
      return `${cssVarName}: ${value};`
    })
    .join('\n    ')

  return `:root {\n    ${vars}\n  }`
})
</script>
<template>
  <teleport to="head">
    <component :is="'style'" data-theme-vars="naive-ui">
      {{ cssVariables }}
    </component>
  </teleport>
  <router-view :class="clsx('w-full', 'h-full')"></router-view>
</template>
