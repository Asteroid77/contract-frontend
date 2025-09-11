<script setup lang="ts">
import clsx from 'clsx'
import LayoutSideBar from './LayoutSideBar.vue'
import { NScrollbar, NCard } from 'naive-ui'
import AuthHeader from '@/components/layout/auth/AuthHeader.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>
<template>
  <div :class="clsx('zw-layout', 'w-full', 'h-full', 'flex')">
    <LayoutSideBar></LayoutSideBar>
    <div :class="clsx('zw-middle', 'grow', 'w-full', 'flex', 'flex-col', 'min-h-0')">
      <AuthHeader></AuthHeader>
      <n-scrollbar :class="clsx('zw-content', 'grow', 'p-content')" trigger="none">
        <n-card :title="route.meta.name">
          <router-view></router-view>
        </n-card>
      </n-scrollbar>
    </div>
  </div>
</template>
