<script setup lang="ts">
import clsx from 'clsx'
import LayoutSideBar from './LayoutSideBar.vue'
import { NScrollbar } from 'naive-ui'
import AuthHeader from '@/components/layout/auth/AuthHeader.vue'
</script>
<template>
  <div :class="clsx('zw-layout', 'w-full', 'h-full', 'flex', 'flex-col')">
    <AuthHeader></AuthHeader>
    <div :class="clsx('zw-middle', 'grow', 'w-full', 'flex')">
      <LayoutSideBar></LayoutSideBar>
      <n-scrollbar :class="clsx('zw-content', 'grow')" trigger="none">
        <router-view></router-view>
      </n-scrollbar>
    </div>
  </div>
</template>
