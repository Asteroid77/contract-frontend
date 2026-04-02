<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSkeleton, NTag } from 'naive-ui'
import type {
  AgentAggregateStructureLevelVO,
  AgentAggregateStructureVO,
} from '@/modules/agent-aggregate/domain/types'
import { VChart } from '../charts/echarts'
import type { ECOption } from '../charts/ec-option'
import {
  createDashboardBarSeries,
  createDashboardCategoryAxis,
  createDashboardGrid,
  createDashboardTooltip,
  createDashboardValueAxis,
} from '../utils/chart-style'
import { useDashboardFormatters } from '../utils/formatters'
import { buildPanelState, type QueryPanelLike } from '../utils/panel-state'
import { safeArray } from '../utils/safe-array'
import DashboardPanelFrame from './DashboardPanelFrame.vue'

type StructureQuery = QueryPanelLike<AgentAggregateStructureVO> & { refetch: () => unknown }

const { query } = defineProps<{
  query: StructureQuery
}>()

const { t: $t, locale } = useI18n()
const requestFailedText = computed(() => $t('domain.agentAggregate.dashboard.state.requestFailed'))

const panelState = buildPanelState(
  query,
  requestFailedText,
  (data) => safeArray<AgentAggregateStructureLevelVO>(data?.levels).length > 0,
)

const { formatInteger, formatPercent } = useDashboardFormatters(locale, $t)

const structureOption = computed<ECOption>(() => {
  const levels = safeArray<AgentAggregateStructureLevelVO>(query.data.value?.levels)

  return {
    grid: createDashboardGrid({ left: 32, right: 24, top: 24, bottom: 24 }),
    tooltip: createDashboardTooltip({ trigger: 'axis', axisPointerType: 'shadow' }),
    xAxis: createDashboardCategoryAxis({
      data: levels.map((item) => `L${item.level}`),
    }),
    yAxis: createDashboardValueAxis(),
    series: [
      createDashboardBarSeries({
        name: $t('domain.agentAggregate.dashboard.panel.structure'),
        data: levels.map((item) => item.agentCount),
        barMaxWidth: 16,
        colorStops: ['#bfdbfe', '#3b82f6'],
      }),
    ],
  }
})

const riskType = computed<'success' | 'warning'>(() =>
  query.data.value?.topHeavyRisk ? 'warning' : 'success',
)

const riskText = computed(() =>
  query.data.value?.topHeavyRisk
    ? $t('domain.agentAggregate.dashboard.structure.topHeavyRiskDetected')
    : $t('domain.agentAggregate.dashboard.structure.balanced'),
)

const headLevelRatioText = computed(() => {
  return `${$t('domain.agentAggregate.dashboard.structure.headLevelRatio')}: ${formatPercent(query.data.value?.headLevelAgentRatio ?? 0)}`
})
</script>

<template>
  <DashboardPanelFrame
    panel-class="agent-aggregate-dashboard__panel--structure"
    :title="$t('domain.agentAggregate.dashboard.panel.structure')"
    :state="panelState"
    :error-title="$t('domain.agentAggregate.dashboard.state.structureFailed')"
    :error-description="requestFailedText"
    :empty-description="$t('domain.agentAggregate.dashboard.state.empty.structure')"
    :on-retry="query.refetch"
    :on-refresh="query.refetch"
  >
    <template #header-right>
      <div class="agent-aggregate-dashboard__risk-wrap">
        <n-tag :type="riskType" :bordered="false">
          {{ riskText }}
        </n-tag>
        <span class="agent-aggregate-dashboard__risk-summary">
          {{ headLevelRatioText }}
        </span>
      </div>
    </template>

    <template #loading>
      <n-skeleton height="24px" width="70%" />
      <n-skeleton height="260px" width="100%" />
    </template>

    <div class="agent-aggregate-dashboard__structure-meta">
      <span>
        {{ $t('domain.agentAggregate.dashboard.structure.total') }}:
        {{ formatInteger(query.data.value?.totalAgentCount ?? 0) }}
      </span>
      <span>
        {{ $t('domain.agentAggregate.dashboard.structure.maxLevel') }}:
        {{ query.data.value?.maxLevel ?? 0 }}
      </span>
      <span>
        {{ $t('domain.agentAggregate.dashboard.structure.avgLevel') }}:
        {{ (query.data.value?.avgLevel ?? 0).toFixed(2) }}
      </span>
    </div>
    <VChart
      class="agent-aggregate-dashboard__chart"
      :option="structureOption"
      :autoresize="{ throttle: 200 }"
    />
  </DashboardPanelFrame>
</template>
