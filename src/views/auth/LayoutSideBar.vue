<script setup lang="ts">
import { NMenu, NIcon, NButton } from 'naive-ui'
import { computed, ref } from 'vue'
import { authRoutes } from '@/router'
import { convertRoutesToMenuItems } from '@/components/layout/_utils/MenuBuilder'
import clsx from 'clsx'
import { getCssVariable } from '@/stores/useThemeStore'
import { PanelLeftExpand20Filled, PanelRightExpand20Filled } from '@vicons/fluent'
const menuOptions = convertRoutesToMenuItems(authRoutes)
const sidebarCollapsedWidth = parseInt(getCssVariable('--side-bar-width--collapsed'))
const sidebarExpandedWidth = parseInt(getCssVariable('--side-bar-width--expanded'))

const isExpanded = ref<boolean>(true)
const sidebarWidth = computed(() => {
  return isExpanded.value ? `${sidebarExpandedWidth}px` : `${sidebarCollapsedWidth}px`
})
const toggle = () => {
  isExpanded.value = !isExpanded.value
}
</script>
<template>
  <div
    :class="
      clsx(
        'max-sm:hidden',
        isExpanded ? 'min-w-siderbar-expanded' : 'min-w-sidebar-collapsed',
        isExpanded ? '' : 'w-sidebar-collapsed',
        'border-r-background',
        'border-r-2',
        'relative',
        'z-1',
        'transition-all',
      )
    "
  >
    <n-menu
      :collapsed-width="sidebarCollapsedWidth"
      :collapsed-icon-size="22"
      :options="menuOptions"
      :collapsed="!isExpanded"
    />
    <n-button
      strong
      secondary
      circle
      :class="
        clsx('absolute!', 'top-1/2', '-translate-y-1/2', '-translate-x-1/2', 'transition-all!')
      "
      :style="{
        left: sidebarWidth,
      }"
      @click="toggle"
    >
      <template #icon>
        <n-icon>
          <PanelLeftExpand20Filled v-if="isExpanded"></PanelLeftExpand20Filled>
          <PanelRightExpand20Filled v-else></PanelRightExpand20Filled>
        </n-icon>
      </template>
    </n-button>
  </div>
</template>
