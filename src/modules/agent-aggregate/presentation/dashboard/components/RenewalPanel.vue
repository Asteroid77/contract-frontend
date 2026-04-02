<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSkeleton } from 'naive-ui'
import type {
  AgentAggregateRenewalVO,
  AgentAggregateRenewalWindowVO,
} from '@/modules/agent-aggregate/domain/types'
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
import { useDashboardFormatters } from '../utils/formatters'
import { buildPanelState, type QueryPanelLike } from '../utils/panel-state'
import { safeArray } from '../utils/safe-array'
import DashboardPanelFrame from './DashboardPanelFrame.vue'

type RenewalQuery = QueryPanelLike<AgentAggregateRenewalVO> & { refetch: () => unknown }

const { query } = defineProps<{
  query: RenewalQuery
}>()

const { t: $t, locale } = useI18n()
const requestFailedText = computed(() => $t('domain.agentAggregate.dashboard.state.requestFailed'))

const panelState = buildPanelState(
  query,
  requestFailedText,
  (data) => safeArray<AgentAggregateRenewalWindowVO>(data?.windows).length > 0,
)

const { formatWindowDays, normalizeRatePercent } = useDashboardFormatters(locale, $t)

const renewalOption = computed<ECOption>(() => {
  const windows = safeArray<AgentAggregateRenewalWindowVO>(query.data.value?.windows)

  return {
    legend: createDashboardLegend(),
    grid: createDashboardGrid({ left: 32, right: 36, top: 34, bottom: 24 }),
    tooltip: createDashboardTooltip({ trigger: 'axis', axisPointerType: 'line' }),
    xAxis: createDashboardCategoryAxis({
      data: windows.map((item) => formatWindowDays(item.windowDays)),
      boundaryGap: true,
    }),
    yAxis: [
      createDashboardValueAxis({ name: $t('domain.agentAggregate.dashboard.chart.count') }),
      createDashboardValueAxis({
        name: $t('domain.agentAggregate.dashboard.chart.ratePercent'),
        formatter: '{value}%',
      }),
    ],
    series: [
      createDashboardBarSeries({
        name: $t('domain.agentAggregate.dashboard.chart.expiring'),
        data: windows.map((item) => item.expiringCount),
        yAxisIndex: 0,
        colorStops: ['#fde68a', '#f59e0b'],
      }),
      createDashboardBarSeries({
        name: $t('domain.agentAggregate.dashboard.chart.renewed'),
        data: windows.map((item) => item.renewedCount),
        yAxisIndex: 0,
        colorStops: ['#99f6e4', '#14b8a6'],
      }),
      createDashboardLineSeries({
        name: $t('domain.agentAggregate.dashboard.chart.renewalRate'),
        data: windows.map((item) => normalizeRatePercent(item.renewalRate)),
        color: chartColor('--color-accent', '#2563eb'),
        yAxisIndex: 1,
        area: true,
      }),
    ],
  }
})
</script>

<template>
  <DashboardPanelFrame
    panel-class="agent-aggregate-dashboard__panel--renewal"
    :title="$t('domain.agentAggregate.dashboard.panel.renewal')"
    :description="$t('domain.agentAggregate.dashboard.panelMeta.renewal')"
    :state="panelState"
    :error-title="$t('domain.agentAggregate.dashboard.state.renewalFailed')"
    :error-description="requestFailedText"
    :empty-description="$t('domain.agentAggregate.dashboard.state.empty.renewal')"
    :on-retry="query.refetch"
    :on-refresh="query.refetch"
  >
    <template #loading>
      <n-skeleton height="18.75rem" width="100%" />
    </template>

    <VChart
      class="agent-aggregate-dashboard__chart agent-aggregate-dashboard__chart--tall"
      :option="renewalOption"
      :autoresize="{ throttle: 200 }"
    />
  </DashboardPanelFrame>
</template>
