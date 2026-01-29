<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { findAllParents } from '@/app/presentation/layout/utils/BreadCrumbBuilder'
import { computed } from 'vue'
import { authRoutes } from '@/router'
import { NBreadcrumb, NBreadcrumbItem } from 'naive-ui'
import type { RouteRecordRaw } from 'vue-router'
import { renderIcon } from '@/_utils/widget/renderIcon'
import { resolveIcon, type IconNames } from '@/app/presentation/layout/utils/MenuBuilder'
const routeInfoMap: { [key: string]: RouteRecordRaw } = {}
authRoutes.map((item) => {
  routeInfoMap[item.name] = item
})
const route = useRoute()
const breadcrumbData = computed(() => {
  const parents = findAllParents(route.name as string, routeInfoMap)
  parents.reverse()
  const result = parents.map((item) => {
    return {
      name: item.name,
      label: item.meta?.name,
      icon: item.meta?.icon,
      show: !item.meta?.hideInBreadcrumb,
      isRoute: !item.meta?.isTransition,
    }
  })
  result.push({
    name: route.name,
    label: route.meta?.name,
    icon: route.meta?.icon,
    show: !route.meta?.hideInBreadcrumb,
    isRoute: !route.meta?.isTransition,
  })
  return result
})
</script>
<template>
  <n-breadcrumb separator=">">
    <n-breadcrumb-item
      v-for="(item, index) in breadcrumbData"
      :key="index"
      :clickable="item.isRoute"
    >
      <component
        :is="renderIcon(resolveIcon(item.icon as IconNames), item.icon)"
        v-if="item.icon"
      ></component>
      <RouterLink v-if="item.isRoute" :to="{ name: item.name }">
        {{ item.label }}
      </RouterLink>
      <template v-else>{{ item.label }}</template>
    </n-breadcrumb-item>
  </n-breadcrumb>
</template>
