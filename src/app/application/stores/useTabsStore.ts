import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

export interface TabItem {
  path: string
  name: string
  titleKey: string
  titleSuffix?: string
}

export const useTabsStore = defineStore('layout-tabs', () => {
  const tabs = ref<TabItem[]>([])
  const activeTab = ref<string>('')

  const tabList = computed(() => tabs.value)

  function normalizeIdValue(value: unknown): string | undefined {
    const raw = Array.isArray(value) ? value[0] : value
    if (raw === null || raw === undefined || raw === '') {
      return undefined
    }
    return String(raw)
  }

  function getRouteIdSuffix(route: RouteLocationNormalizedLoaded): string | undefined {
    const queryId = normalizeIdValue(route.query.id)
    if (queryId) {
      return `#${queryId}`
    }

    const paramId = normalizeIdValue(route.params.id)
    if (paramId) {
      return `#${paramId}`
    }

    return undefined
  }

  function addTab(route: RouteLocationNormalizedLoaded) {
    const routeName = route.name?.toString() || route.path
    if (routeName === 'layout' || route.path === '/') return
    if (route.meta.requiresAuth === false) return

    const tabPath = route.fullPath
    const tabTitleKey = (route.meta.name as string) || routeName
    const tabTitleSuffix = getRouteIdSuffix(route)

    const exists = tabs.value.find((tab) => tab.path === tabPath)
    if (!exists) {
      tabs.value.push({
        path: tabPath,
        name: routeName,
        titleKey: tabTitleKey,
        titleSuffix: tabTitleSuffix,
      })
    } else {
      exists.name = routeName
      exists.titleKey = tabTitleKey
      exists.titleSuffix = tabTitleSuffix
    }

    activeTab.value = tabPath
  }

  function removeTab(path: string): string {
    const index = tabs.value.findIndex((tab) => tab.path === path)
    if (index === -1) {
      return '/dashboard'
    }

    tabs.value.splice(index, 1)

    if (tabs.value.length === 0) {
      activeTab.value = ''
      return '/dashboard'
    }

    const nextIndex = Math.max(0, index - 1)
    const nextPath = tabs.value[nextIndex]?.path ?? tabs.value[tabs.value.length - 1].path

    if (activeTab.value === path) {
      activeTab.value = nextPath
    }

    return nextPath
  }

  function setActiveTab(path: string) {
    activeTab.value = path
  }

  function clearTabs() {
    tabs.value = []
    activeTab.value = ''
  }

  return {
    tabList,
    activeTab,
    addTab,
    removeTab,
    setActiveTab,
    clearTabs,
  }
})
