<script setup lang="ts">
import clsx from 'clsx'
import LayoutSideBar from './LayoutSideBar.vue'
import { NScrollbar, NCard } from 'naive-ui'
import AuthHeader from '@/components/layout/auth/AuthHeader.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { match } from 'ts-pattern'
const route = useRoute()
const positionClz = computed(() => {
  return match(route.name)
    .when(
      (r) => r?.toString().includes('result'),
      () => {
        return 'flex items-center justify-center'
      },
    )
    .otherwise(() => '')
})
</script>
<template>
  <div :class="clsx('zw-layout', 'w-full', 'h-full', 'flex')">
    <LayoutSideBar></LayoutSideBar>
    <div :class="clsx('zw-middle', 'grow', 'w-full', 'flex', 'flex-col', 'min-h-0')">
      <AuthHeader></AuthHeader>
      <n-card v-if="positionClz" :title="route.meta.name" :class="clsx('w-full', 'h-full')">
        <div :class="clsx('w-full', 'h-full', positionClz)">
          <router-view v-slot="{ Component }">
            <div class="w-full">
              <component :is="Component"></component>
            </div>
          </router-view>
        </div>
      </n-card>
      <n-scrollbar :class="clsx('zw-content', 'grow', 'p-content')" trigger="none" v-else>
        <n-card :title="route.meta.name" :class="clsx('w-full', 'h-full')">
          <router-view></router-view>
        </n-card>
      </n-scrollbar>
    </div>
  </div>
</template>
