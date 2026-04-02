<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NRadioButton, NRadioGroup, NSkeleton } from 'naive-ui'
import type {
  AgentAggregatePerformanceVO,
  AgentAggregateTopAgentVO,
} from '@/modules/agent-aggregate/domain/types'
import { VChart } from '../charts/echarts'
import type { ECOption } from '../charts/ec-option'
import { chartColor } from '../utils/chart-color'
import {
  createDashboardBarSeries,
  createDashboardGrid,
  createDashboardTooltip,
} from '../utils/chart-style'
import { useDashboardFormatters } from '../utils/formatters'
import { buildPanelState, type QueryPanelLike } from '../utils/panel-state'
import { buildPerformanceChartData, type PerformanceMetric } from '../utils/performance-chart'
import { safeArray } from '../utils/safe-array'
import DashboardPanelFrame from './DashboardPanelFrame.vue'

type PerformanceQuery = QueryPanelLike<AgentAggregatePerformanceVO> & { refetch: () => unknown }

const props = defineProps<{
  query: PerformanceQuery
  topLimit: number
}>()

const { t: $t, locale } = useI18n()
const requestFailedText = computed(() => $t('domain.agentAggregate.dashboard.state.requestFailed'))

const panelState = buildPanelState(
  props.query,
  requestFailedText,
  (data) => safeArray<AgentAggregateTopAgentVO>(data?.topAgents).length > 0,
)

const { formatInteger, formatPercent } = useDashboardFormatters(locale, $t)

const metric = ref<PerformanceMetric>('signingCount')

const performanceMetricThemeOverrides = computed(() => ({
  buttonColor: chartColor('--color-bg-card', '#ffffff'),
  buttonColorActive: chartColor('--color-primary', '#334155'),
  buttonTextColor: chartColor('--color-text-body', '#334155'),
  buttonTextColorHover: chartColor('--color-text-main', '#0f172a'),
  buttonTextColorActive: chartColor('--color-bg-card', '#ffffff'),
  buttonBorderColor: chartColor('--color-border', '#e2e8f0'),
  buttonBorderColorActive: chartColor('--color-primary', '#334155'),
  buttonBorderColorHover: chartColor('--color-primary-hover', '#475569'),
  buttonBoxShadow: 'none',
  buttonBoxShadowHover: 'none',
  buttonBoxShadowFocus: 'none',
}))

const metricOptions = computed<Array<{ label: string; value: PerformanceMetric }>>(() => [
  {
    label: $t('domain.agentAggregate.dashboard.metric.signing'),
    value: 'signingCount',
  },
  {
    label: $t('domain.agentAggregate.dashboard.metric.filing'),
    value: 'filingCount',
  },
  {
    label: $t('domain.agentAggregate.dashboard.metric.charge'),
    value: 'yearUsableChargeTotal',
  },
])

const performanceOption = computed<ECOption>(() => {
  const chartData = buildPerformanceChartData(
    props.query.data.value?.topAgents,
    props.topLimit,
    metric.value,
  )

  return {
    grid: createDashboardGrid({ left: 84, right: 24, top: 20, bottom: 18 }),
    tooltip: createDashboardTooltip({ trigger: 'axis', axisPointerType: 'shadow' }),
    xAxis: {
      type: 'value',
      axisLabel: {
        color: chartColor('--color-text-light', '#64748b'),
        fontSize: 12,
      },
      axisTick: { show: false },
      axisLine: { show: false },
      splitLine: {
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.16)',
        },
      },
    },
    yAxis: {
      type: 'category',
      data: chartData.labels,
      axisLabel: {
        color: chartColor('--color-text-body', '#334155'),
        fontSize: 12,
      },
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [
      createDashboardBarSeries({
        name: $t('domain.agentAggregate.dashboard.panel.performance'),
        data: chartData.values,
        barMaxWidth: 16,
        horizontal: true,
        colorStops: ['#cbd5f5', '#60a5fa'],
      }),
    ],
  }
})

const performanceSummary = computed(() => {
  const performance = props.query.data.value

  if (!performance) {
    return $t('domain.agentAggregate.dashboard.panelMeta.performance')
  }

  return $t('domain.agentAggregate.dashboard.performance.summary', {
    active: formatInteger(performance.activeAgentCount),
    total: formatInteger(performance.totalAgentCount),
    ratio: formatPercent(performance.activeAgentRatio),
  })
})
</script>

<template>
  <DashboardPanelFrame
    panel-class="agent-aggregate-dashboard__panel--performance"
    header-class="agent-aggregate-dashboard__panel-header--performance"
    :title="$t('domain.agentAggregate.dashboard.panel.performance')"
    :state="panelState"
    :error-title="$t('domain.agentAggregate.dashboard.state.performanceFailed')"
    :error-description="requestFailedText"
    :empty-description="$t('domain.agentAggregate.dashboard.state.empty.performance')"
    :on-retry="props.query.refetch"
    :on-refresh="props.query.refetch"
  >
    <template #header-center>
      <n-radio-group
        v-model:value="metric"
        size="small"
        :theme-overrides="performanceMetricThemeOverrides"
      >
        <n-radio-button v-for="option in metricOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </n-radio-button>
      </n-radio-group>
    </template>

    <template #header-right>
      <span class="agent-aggregate-dashboard__panel-meta">
        {{ performanceSummary }}
      </span>
    </template>

    <template #loading>
      <n-skeleton height="300px" width="100%" />
    </template>

    <VChart
      class="agent-aggregate-dashboard__chart agent-aggregate-dashboard__chart--tall"
      :option="performanceOption"
      :autoresize="{ throttle: 200 }"
    />
  </DashboardPanelFrame>
</template>
