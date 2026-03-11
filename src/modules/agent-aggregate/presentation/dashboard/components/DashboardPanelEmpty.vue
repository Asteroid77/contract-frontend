<script setup lang="ts">
import { NButton, NEmpty } from 'naive-ui'
import { useI18n } from 'vue-i18n'

defineProps<{
  description: string
  onRefresh: () => unknown
}>()

const { t: $t } = useI18n()
</script>

<template>
  <div class="agent-aggregate-dashboard__panel-state agent-aggregate-dashboard__panel-state--empty">
    <n-empty :description="description">
      <template #extra>
        <n-button secondary @click="onRefresh()">
          {{ $t('domain.agentAggregate.dashboard.action.refresh') }}
        </n-button>
      </template>
    </n-empty>
  </div>
</template>
