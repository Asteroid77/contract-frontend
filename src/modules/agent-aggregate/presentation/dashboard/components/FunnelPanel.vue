<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSkeleton } from 'naive-ui'
import type { AgentAggregateFunnelVO } from '@/modules/agent-aggregate/domain/types'
import { VChart } from '../charts/echarts'
import type { ECOption } from '../charts/ec-option'
import { chartColor } from '../utils/chart-color'
import { createDashboardTooltip } from '../utils/chart-style'
import { hasFunnelPanelData } from '../utils/panel-data'
import { buildPanelState, type QueryPanelLike } from '../utils/panel-state'
import DashboardPanelFrame from './DashboardPanelFrame.vue'

type FunnelQuery = QueryPanelLike<AgentAggregateFunnelVO> & { refetch: () => unknown }

const { query } = defineProps<{
  query: FunnelQuery
}>()

const { t: $t } = useI18n()
const requestFailedText = computed(() => $t('domain.agentAggregate.dashboard.state.requestFailed'))

const panelState = buildPanelState(query, requestFailedText, hasFunnelPanelData)

const funnelOption = computed<ECOption>(() => {
  const funnel = query.data.value

  return {
    color: ['#cbd5f5', '#93c5fd', '#5eead4'],
    tooltip: createDashboardTooltip({ trigger: 'item', axisPointerType: 'shadow' }),
    series: [
      {
        type: 'funnel',
        left: '10%',
        right: '10%',
        top: 24,
        bottom: 16,
        min: 0,
        max: Math.max(funnel?.agentCount ?? 0, 1),
        minSize: '28%',
        maxSize: '100%',
        sort: 'descending',
        gap: 10,
        animationDuration: 620,
        animationDurationUpdate: 320,
        animationEasing: 'cubicOut',
        animationEasingUpdate: 'quadraticOut',
        label: {
          color: chartColor('--color-text-main', '#0f172a'),
          fontSize: 12,
          lineHeight: 18,
          fontWeight: 600,
          formatter: '{b}\n{c}',
        },
        labelLine: {
          length: 10,
          lineStyle: {
            color: chartColor('--color-border', '#e2e8f0'),
          },
        },
        itemStyle: {
          borderColor: chartColor('--color-bg-card', '#ffffff'),
          borderWidth: 2,
          borderRadius: 14,
          shadowBlur: 12,
          shadowOffsetY: 6,
          shadowColor: 'rgba(15, 23, 42, 0.06)',
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 16,
            shadowColor: 'rgba(37, 99, 235, 0.10)',
          },
        },
        data: [
          {
            name: $t('domain.agentAggregate.dashboard.kpi.agents'),
            value: funnel?.agentCount ?? 0,
          },
          {
            name: $t('domain.agentAggregate.dashboard.kpi.filing'),
            value: funnel?.filingCount ?? 0,
          },
          {
            name: $t('domain.agentAggregate.dashboard.kpi.signing'),
            value: funnel?.signingCount ?? 0,
          },
        ],
      },
    ],
  }
})
</script>

<template>
  <DashboardPanelFrame
    panel-class="agent-aggregate-dashboard__panel--funnel"
    :title="$t('domain.agentAggregate.dashboard.panel.funnel')"
    :description="$t('domain.agentAggregate.dashboard.panelMeta.funnel')"
    :state="panelState"
    :error-title="$t('domain.agentAggregate.dashboard.state.funnelFailed')"
    :error-description="requestFailedText"
    :empty-description="$t('domain.agentAggregate.dashboard.state.empty.funnel')"
    :on-retry="query.refetch"
    :on-refresh="query.refetch"
  >
    <template #loading>
      <n-skeleton height="18.75rem" width="100%" />
    </template>

    <VChart
      class="agent-aggregate-dashboard__chart agent-aggregate-dashboard__chart--tall"
      :option="funnelOption"
      :autoresize="{ throttle: 200 }"
    />
  </DashboardPanelFrame>
</template>
