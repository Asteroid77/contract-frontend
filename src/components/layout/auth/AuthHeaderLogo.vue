<script lang="ts" setup>
import { NDrawerContent, NDrawer, NMenu } from 'naive-ui'
import { ref } from 'vue'
import { authRoutes } from '@/router'
import { convertRoutesToMenuItems } from '../_utils/MenuBuilder'
import clsx from 'clsx'
import { getCssVariable } from '@/stores/useThemeStore'

const menuOptions = convertRoutesToMenuItems(authRoutes)

const drawerShow = ref<boolean>(false)
const drawerShowToggle = () => {
  drawerShow.value = !drawerShow.value
}
const sideBarCollapsedWidth = parseInt(getCssVariable('--side-bar-width--collapsed'))
</script>
<template>
  <div :class="clsx('zw-header--logo', 'flex', 'items-center')">
    <img
      :src="'/src/assert/logo.png'"
      alt="logo"
      @click="drawerShowToggle"
      :class="clsx('sm:hidden', 'w-sidebar-collapsed')"
    />
    <img
      :src="'/src/assert/logo.png'"
      alt="logo"
      :class="clsx('max-sm:hidden', 'w-sidebar-collapsed')"
    />
    <n-drawer v-model:show="drawerShow" :width="300" placement="left">
      <n-drawer-content>
        <n-menu
          :collapsed-width="sideBarCollapsedWidth"
          :collapsed-icon-size="22"
          :options="menuOptions"
        />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
