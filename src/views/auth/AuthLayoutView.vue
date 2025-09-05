<script setup lang="ts">
import clsx from 'clsx'
import LayoutSideBar from './LayoutSideBar.vue'
import { NScrollbar } from 'naive-ui'
import BreadCrumb from '@/components/layout/auth/BreadCrumb.vue'
</script>
<template>
  <div :class="clsx('zw-layout', 'w-full', 'h-full', 'flex', 'flex-col')">
    <div :class="clsx('zw-header', 'w-full', 'h-14', 'p-text')">
      <BreadCrumb></BreadCrumb>
    </div>
    <div :class="clsx('zw-middle', 'grow', 'w-full', 'flex')">
      <LayoutSideBar></LayoutSideBar>
      <n-scrollbar :class="clsx('zw-content', 'grow')" trigger="none">
        <router-view></router-view>
      </n-scrollbar>
    </div>
  </div>
</template>
