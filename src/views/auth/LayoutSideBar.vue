<script setup lang="ts">
import { NMenu, NLayout, NLayoutSider } from 'naive-ui'
import { ref } from 'vue'
import { authRoutes } from '@/router'
import { convertRoutesToMenuItems } from '@/components/layout/_utils/MenuBuilder'
const collapseFrag = ref<boolean>(true)
const menuOptions = convertRoutesToMenuItems(authRoutes)
</script>
<template>
  <n-layout has-sider>
    <n-layout-sider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :collapsed="collapseFrag"
      show-trigger
    >
      <n-menu :collapsed-width="64" :collapsed-icon-size="22" :options="menuOptions" />
    </n-layout-sider>
    <n-layout>
      <span>内容</span>
    </n-layout>
  </n-layout>
</template>
