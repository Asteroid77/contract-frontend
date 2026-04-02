<script setup lang="ts">
import { NButton, NResult } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import type { PanelErrorMeta } from '../utils/panel-state'

defineProps<{
  title: string
  description: string
  errorMeta?: PanelErrorMeta
  onRetry: () => unknown
}>()

const { t: $t } = useI18n()
</script>

<template>
  <n-result
    status="error"
    :title="title"
    :description="description"
    class="agent-aggregate-dashboard__panel-state"
  >
    <template #footer>
      <div class="agent-aggregate-dashboard__error-meta">
        <span v-if="errorMeta?.traceId">
          {{ $t('domain.agentAggregate.dashboard.field.traceId') }}: {{ errorMeta.traceId }}
        </span>
        <span v-if="errorMeta?.requestId">
          {{ $t('domain.agentAggregate.dashboard.field.requestId') }}: {{ errorMeta.requestId }}
        </span>
      </div>
      <n-button type="primary" @click="onRetry()">
        {{ $t('domain.agentAggregate.dashboard.action.retry') }}
      </n-button>
    </template>
  </n-result>
</template>
