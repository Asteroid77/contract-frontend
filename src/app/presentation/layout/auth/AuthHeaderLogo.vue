<script lang="ts" setup>
import { NDrawerContent, NDrawer, NMenu, NCard } from 'naive-ui'
import { ref, useTemplateRef, watch } from 'vue'
import { authRoutes } from '@/router'
import { convertRoutesToMenuItems } from '@/app/presentation/layout/utils/MenuBuilder'
import clsx from 'clsx'
import { useRoute } from 'vue-router'
import { useCssVar } from '@/app/presentation/theme/hooks/useCssVar'
import { useI18n } from 'vue-i18n'
import { parseCssLengthToPx } from '@/app/presentation/layout/utils/cssLength'
const route = useRoute()
const { t: $t } = useI18n()

const menuOptions = convertRoutesToMenuItems(authRoutes)

const drawerShow = ref<boolean>(false)
const drawerShowToggle = () => {
  drawerShow.value = !drawerShow.value
}

const sideBarCollapsedWidth = parseCssLengthToPx(
  useCssVar('--sider-collapsed-width').value || '4rem',
)
const sideBarExpandedWidth = parseCssLengthToPx(useCssVar('--sider-width').value || '15rem')
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
  <div :class="clsx('zw-header--logo', 'flex', 'items-center')">
    <img
      :src="'/src/assert/logo.png'"
      alt="logo"
      @click="drawerShowToggle"
      :class="clsx('sm:hidden', 'w-sidebar-collapsed')"
    />
    <n-drawer v-model:show="drawerShow" :width="sideBarExpandedWidth" placement="left">
      <n-drawer-content>
        <n-card :title="$t('layout.menu.title')" :bordered="false">
          <n-menu
            :collapsed-width="sideBarCollapsedWidth"
            :collapsed-icon-size="22"
            :options="menuOptions"
            v-model:value="selectedKey"
            ref="menuInstRef"
          />
        </n-card>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
