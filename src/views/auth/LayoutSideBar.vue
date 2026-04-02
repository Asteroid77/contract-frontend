<script setup lang="ts">
import { NMenu, NButton } from 'naive-ui'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { authRoutes } from '@/router'
import { convertRoutesToMenuItems } from '@/app/presentation/layout/utils/MenuBuilder'
import clsx from 'clsx'
import ZwIcon from '@/modules/shared/presentation/widget/ZwIcon.vue'
import { useRoute } from 'vue-router'
import { useCssVar } from '@/app/presentation/theme/hooks/useCssVar'
import LogoImage from '@/assets/logo.png'
import { parseCssLengthToPx } from '@/app/presentation/layout/utils/cssLength'
const route = useRoute()
const menuOptions = convertRoutesToMenuItems(authRoutes)

const sidebarCollapsedWidth = parseCssLengthToPx(
  useCssVar('--sider-collapsed-width').value || '4rem',
)
const sidebarExpandedWidth = parseCssLengthToPx(useCssVar('--sider-width').value || '15rem')

const isExpanded = ref<boolean>(true)
const sidebarWidth = computed(() => {
  return isExpanded.value ? `${sidebarExpandedWidth}px` : `${sidebarCollapsedWidth}px`
})
const toggle = () => {
  isExpanded.value = !isExpanded.value
}
const selectedKey = ref<string>()
const menuInstRef = useTemplateRef('menuInstRef')
const selectAndExpand = (key: string) => {
  selectedKey.value = key
  menuInstRef.value?.showOption(key)
}
watch(
  route,
  (value) => {
    selectAndExpand(value.name as string)
  },
  { immediate: true },
)
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
        'z-1',
        'transition-all',
      )
    "
  >
    <div
      :class="
        clsx(
          'w-full',
          'flex',
          'justify-center',
          'border-y-2',
          'border-background',
          'h-14',
          'items-center',
          'relative',
        )
      "
    >
      <img :src="LogoImage" alt="logo" :class="clsx(isExpanded ? 'w-16' : 'w-12')" />
      <n-button
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
          <ZwIcon v-if="isExpanded" name="icon-expanded" :size="14"></ZwIcon>
          <ZwIcon v-else name="icon-menu_collasped" :size="14"></ZwIcon>
        </template>
      </n-button>
    </div>
    <n-menu
      :collapsed-width="sidebarCollapsedWidth"
      :collapsed-icon-size="22"
      :options="menuOptions"
      :collapsed="!isExpanded"
      ref="menuInstRef"
      v-model:value="selectedKey"
    />
  </div>
</template>
