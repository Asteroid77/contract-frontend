<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSkeleton } from 'naive-ui'
import type { AgentAggregateTrendPointVO, AgentAggregateTrendVO } from '@/modules/agent-aggregate/domain/types'
import { VChart } from '../charts/echarts'
import type { ECOption } from '../charts/ec-option'
import { chartColor } from '../utils/chart-color'
import {
  createDashboardBarSeries,
  createDashboardCategoryAxis,
  createDashboardGrid,
  createDashboardLegend,
  createDashboardLineSeries,
  createDashboardTooltip,
  createDashboardValueAxis,
} from '../utils/chart-style'
import { buildPanelState, type QueryPanelLike } from '../utils/panel-state'
import { safeArray } from '../utils/safe-array'
import DashboardPanelFrame from './DashboardPanelFrame.vue'

type TrendQuery = QueryPanelLike<AgentAggregateTrendVO> & { refetch: () => unknown }

const { query } = defineProps<{
  query: TrendQuery
}>()

const { t: $t } = useI18n()
const requestFailedText = computed(() => $t('domain.agentAggregate.dashboard.state.requestFailed'))

const panelState = buildPanelState(query, requestFailedText, (data) =>
  safeArray<AgentAggregateTrendPointVO>(data?.points).length > 0,
)

const trendOption = computed<ECOption>(() => {
  const points = safeArray<AgentAggregateTrendPointVO>(query.data.value?.points)

  const linePrimary = chartColor('--color-accent', '#2563eb')
  const lineCool = chartColor('--color-primary', '#334155')
  const lineTeal = '#0f766e'

  return {
    grid: createDashboardGrid({ left: 28, right: 28, top: 38, bottom: 20 }),
    legend: createDashboardLegend(),
    tooltip: createDashboardTooltip({ trigger: 'axis', axisPointerType: 'line' }),
    xAxis: createDashboardCategoryAxis({
      data: points.map((item) => item.date),
      boundaryGap: true,
    }),
    yAxis: [
      createDashboardValueAxis({ name: $t('domain.agentAggregate.dashboard.chart.count') }),
      createDashboardValueAxis({ name: $t('domain.agentAggregate.dashboard.chart.charge') }),
    ],
    series: [
      createDashboardLineSeries({
        name: $t('domain.agentAggregate.dashboard.chart.newAgents'),
        data: points.map((item) => item.newAgentCount),
        color: linePrimary,
        area: true,
      }),
      createDashboardLineSeries({
        name: $t('domain.agentAggregate.dashboard.kpi.filing'),
        data: points.map((item) => item.filingCount),
        color: lineTeal,
      }),
      createDashboardLineSeries({
        name: $t('domain.agentAggregate.dashboard.kpi.signing'),
        data: points.map((item) => item.signingCount),
        color: lineCool,
      }),
      createDashboardBarSeries({
        name: $t('domain.agentAggregate.dashboard.kpi.yearCharge'),
        data: points.map((item) => item.yearUsableChargeTotal),
        yAxisIndex: 1,
        barMaxWidth: 12,
        colorStops: ['#dbeafe', '#60a5fa'],
      }),
    ],
  }
})
</script>

<template>
  <DashboardPanelFrame
    panel-class="agent-aggregate-dashboard__panel--trend"
    :title="$t('domain.agentAggregate.dashboard.panel.trend')"
    :description="$t('domain.agentAggregate.dashboard.panelMeta.trend')"
    :state="panelState"
    :error-title="$t('domain.agentAggregate.dashboard.state.trendFailed')"
    :error-description="requestFailedText"
    :empty-description="$t('domain.agentAggregate.dashboard.state.empty.trend')"
    :on-retry="query.refetch"
    :on-refresh="query.refetch"
  >
    <template #loading>
      <n-skeleton height="300px" width="100%" />
    </template>

    <VChart
      class="agent-aggregate-dashboard__chart agent-aggregate-dashboard__chart--tall"
      :option="trendOption"
      :autoresize="{ throttle: 200 }"
    />
  </DashboardPanelFrame>
</template>
