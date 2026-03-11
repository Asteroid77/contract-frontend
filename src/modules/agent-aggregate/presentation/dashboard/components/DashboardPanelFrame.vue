<script setup lang="ts">
import { NCard, NSkeleton } from 'naive-ui'
import type { PanelState } from '../utils/panel-state'
import DashboardPanelEmpty from './DashboardPanelEmpty.vue'
import DashboardPanelError from './DashboardPanelError.vue'

const props = defineProps<{
  panelClass: string
  title: string
  description?: string
  state: PanelState
  headerClass?: string
  errorTitle: string
  errorDescription: string
  emptyDescription: string
  onRetry: () => unknown
  onRefresh: () => unknown
}>()
</script>

<template>
  <n-card
    :bordered="false"
    :class="['notion-card', 'agent-aggregate-dashboard__panel', panelClass]"
  >
    <template #header>
      <div :class="['agent-aggregate-dashboard__panel-header', headerClass]">
        <h2 class="agent-aggregate-dashboard__panel-title">
          {{ title }}
        </h2>
        <div v-if="$slots['header-center']" class="agent-aggregate-dashboard__panel-center">
          <slot name="header-center" />
        </div>
        <slot name="header-right">
          <span v-if="description" class="agent-aggregate-dashboard__panel-meta">
            {{ description }}
          </span>
        </slot>
      </div>
    </template>

    <div class="agent-aggregate-dashboard__panel-body">
      <template v-if="state.status === 'loading'">
        <slot name="loading">
          <n-skeleton height="300px" width="100%" />
        </slot>
      </template>

      <DashboardPanelError
        v-else-if="state.status === 'error'"
        :title="errorTitle"
        :description="state.errorMeta?.message ?? errorDescription"
        :error-meta="state.errorMeta"
        :on-retry="onRetry"
      />

      <DashboardPanelEmpty
        v-else-if="state.status === 'empty'"
        :description="emptyDescription"
        :on-refresh="onRefresh"
      />

      <template v-else>
        <slot />
      </template>
    </div>
  </n-card>
</template>
