<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NSelect } from 'naive-ui'
import {
  useAgentAggregateFunnel,
  useAgentAggregateOverview,
  useAgentAggregatePerformance,
  useAgentAggregateRenewal,
  useAgentAggregateStructure,
  useAgentAggregateTrend,
} from '@/modules/agent-aggregate/application/hooks/useAgentAggregateService'
import type {
  AgentAggregatePerformanceParams,
  AgentAggregateTrendParams,
} from '@/modules/agent-aggregate/domain/types'
import FunnelPanel from './components/FunnelPanel.vue'
import OverviewPanel from './components/OverviewPanel.vue'
import PerformancePanel from './components/PerformancePanel.vue'
import RenewalPanel from './components/RenewalPanel.vue'
import StructurePanel from './components/StructurePanel.vue'
import TrendPanel from './components/TrendPanel.vue'
import './styles/AgentAggregateDashboard.css'

const { t: $t } = useI18n()

const trendDay = ref<number>(30)
const performanceTop = ref<number>(10)

const trendDayOptions = computed<Array<{ label: string; value: number }>>(() =>
  [7, 30, 90].map((days) => ({
    label: $t('domain.agentAggregate.dashboard.option.lastDays', { days }),
    value: days,
  })),
)

const performanceTopOptions = computed<Array<{ label: string; value: number }>>(() =>
  [5, 10, 20].map((count) => ({
    label: $t('domain.agentAggregate.dashboard.option.topN', { count }),
    value: count,
  })),
)

const trendParams = computed<AgentAggregateTrendParams>(() => ({
  days: trendDay.value,
}))

const performanceParams = computed<AgentAggregatePerformanceParams>(() => ({
  top: performanceTop.value,
}))

const overviewQuery = useAgentAggregateOverview()
const funnelQuery = useAgentAggregateFunnel()
const trendQuery = useAgentAggregateTrend(trendParams)
const performanceQuery = useAgentAggregatePerformance(performanceParams)
const structureQuery = useAgentAggregateStructure()
const renewalQuery = useAgentAggregateRenewal()

const allQueries = [
  overviewQuery,
  funnelQuery,
  trendQuery,
  performanceQuery,
  structureQuery,
  renewalQuery,
]

const handleRefetchAll = async () => {
  await Promise.allSettled(allQueries.map((query) => query.refetch()))
}
</script>

<template>
  <div class="agent-aggregate-dashboard">
    <div class="agent-aggregate-dashboard__toolbar">
      <div class="agent-aggregate-dashboard__title-wrap">
        <h1 class="agent-aggregate-dashboard__title">
          {{ $t('domain.agentAggregate.dashboard.title') }}
        </h1>
        <p class="agent-aggregate-dashboard__subtitle">
          {{ $t('domain.agentAggregate.dashboard.subtitle') }}
        </p>
      </div>

      <div class="agent-aggregate-dashboard__toolbar-actions">
        <n-select
          v-model:value="trendDay"
          :options="trendDayOptions"
          size="small"
          class="agent-aggregate-dashboard__control"
        />
        <n-select
          v-model:value="performanceTop"
          :options="performanceTopOptions"
          size="small"
          class="agent-aggregate-dashboard__control"
        />
        <n-button
          secondary
          :loading="allQueries.some((item) => item.isFetching.value)"
          @click="handleRefetchAll"
        >
          {{ $t('domain.agentAggregate.dashboard.action.refresh') }}
        </n-button>
      </div>
    </div>

    <div class="agent-aggregate-dashboard__grid">
      <OverviewPanel :query="overviewQuery" />
      <FunnelPanel :query="funnelQuery" />
      <TrendPanel :query="trendQuery" />
      <PerformancePanel :query="performanceQuery" :top-limit="performanceTop" />
      <StructurePanel :query="structureQuery" />
      <RenewalPanel :query="renewalQuery" />
    </div>
  </div>
</template>
