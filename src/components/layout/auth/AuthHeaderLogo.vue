<script lang="ts" setup>
import { NDrawerContent, NDrawer, NMenu } from 'naive-ui'
import { ref } from 'vue'
import { authRoutes } from '@/router'
import { convertRoutesToMenuItems } from '../_utils/MenuBuilder'
import clsx from 'clsx'

const menuOptions = convertRoutesToMenuItems(authRoutes)

const drawerShow = ref<boolean>(false)
const drawerShowToggle = () => {
  drawerShow.value = !drawerShow.value
}
</script>
<template>
  <div :class="clsx('zw-header--logo')">
    <img
      :src="'/src/assert/logo.png'"
      alt="logo"
      @click="drawerShowToggle"
      :class="clsx('sm:hidden', 'w-14')"
    />
    <img :src="'/src/assert/logo.png'" alt="logo" :class="clsx('max-sm:hidden', 'w-14')" />
    <n-drawer v-model:show="drawerShow" :width="300" placement="left">
      <n-drawer-content>
        <n-menu :collapsed-width="64" :collapsed-icon-size="22" :options="menuOptions" />
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
