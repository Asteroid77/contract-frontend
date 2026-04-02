<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSkeleton, NStatistic } from 'naive-ui'
import type {
  AgentAggregateOverviewVO,
  AgentAggregateRegionVO,
} from '@/modules/agent-aggregate/domain/types'
import { VChart } from '../charts/echarts'
import type { ECOption } from '../charts/ec-option'
import { chartColor } from '../utils/chart-color'
import {
  createDashboardBarSeries,
  createDashboardCategoryAxis,
  createDashboardGrid,
  createDashboardTooltip,
  createDashboardValueAxis,
} from '../utils/chart-style'
import { useDashboardFormatters } from '../utils/formatters'
import { hasOverviewPanelData } from '../utils/panel-data'
import { buildPanelState, type QueryPanelLike } from '../utils/panel-state'
import { safeArray } from '../utils/safe-array'
import DashboardPanelFrame from './DashboardPanelFrame.vue'

type OverviewQuery = QueryPanelLike<AgentAggregateOverviewVO> & { refetch: () => unknown }

const { query } = defineProps<{
  query: OverviewQuery
}>()

const { t: $t, locale } = useI18n()
const requestFailedText = computed(() => $t('domain.agentAggregate.dashboard.state.requestFailed'))

const panelState = buildPanelState(query, requestFailedText, hasOverviewPanelData)

const { formatInteger } = useDashboardFormatters(locale, $t)

const kpis = computed(() => {
  const overview = query.data.value

  return [
    { label: $t('domain.agentAggregate.dashboard.kpi.agents'), value: overview?.agentCount ?? 0 },
    { label: $t('domain.agentAggregate.dashboard.kpi.filing'), value: overview?.filingCount ?? 0 },
    {
      label: $t('domain.agentAggregate.dashboard.kpi.signing'),
      value: overview?.signingCount ?? 0,
    },
    {
      label: $t('domain.agentAggregate.dashboard.kpi.yearCharge'),
      value: overview?.yearUsableChargeTotal ?? 0,
    },
  ]
})

const overviewRegionsOption = computed<ECOption>(() => {
  const regions = [...safeArray<AgentAggregateRegionVO>(query.data.value?.regions)]
    .sort((a, b) => b.agentCount - a.agentCount)
    .slice(0, 8)

  return {
    grid: createDashboardGrid({ left: 96, right: 24, top: 20, bottom: 16 }),
    tooltip: createDashboardTooltip({ trigger: 'axis', axisPointerType: 'shadow' }),
    xAxis: createDashboardValueAxis(),
    yAxis: createDashboardCategoryAxis({
      data: regions.map((item) => item.regionCode),
    }),
    series: [
      createDashboardBarSeries({
        name: $t('domain.agentAggregate.dashboard.kpi.agents'),
        data: regions.map((item) => item.agentCount),
        horizontal: true,
        colorStops: ['#dbeafe', '#60a5fa'],
      }),
    ],
  }
})
</script>

<template>
  <DashboardPanelFrame
    panel-class="agent-aggregate-dashboard__panel--overview"
    :title="$t('domain.agentAggregate.dashboard.panel.overview')"
    :description="$t('domain.agentAggregate.dashboard.panelMeta.overview')"
    :state="panelState"
    :error-title="$t('domain.agentAggregate.dashboard.state.overviewFailed')"
    :error-description="requestFailedText"
    :empty-description="$t('domain.agentAggregate.dashboard.state.empty.overview')"
    :on-retry="query.refetch"
    :on-refresh="query.refetch"
  >
    <template #loading>
      <n-skeleton :repeat="4" height="1.5rem" width="100%" />
      <n-skeleton height="16.25rem" width="100%" />
    </template>

    <div class="agent-aggregate-dashboard__kpi-grid">
      <div v-for="item in kpis" :key="item.label" class="agent-aggregate-dashboard__kpi">
        <n-statistic :label="item.label" :value="formatInteger(item.value)" />
      </div>
    </div>

    <VChart
      class="agent-aggregate-dashboard__chart"
      :option="overviewRegionsOption"
      :autoresize="{ throttle: 200 }"
    />
  </DashboardPanelFrame>
</template>
