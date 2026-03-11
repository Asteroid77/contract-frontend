import type { AgentAggregateTopAgentVO } from '@/modules/agent-aggregate/domain/types'
import { safeArray } from './safe-array'

export type PerformanceMetric = 'signingCount' | 'filingCount' | 'yearUsableChargeTotal'

const getMetricValue = (agent: AgentAggregateTopAgentVO, metric: PerformanceMetric): number => {
  if (metric === 'filingCount') {
    return agent.filingCount
  }
  if (metric === 'yearUsableChargeTotal') {
    return agent.yearUsableChargeTotal
  }
  return agent.signingCount
}

export const buildPerformanceChartData = (
  topAgents: AgentAggregateTopAgentVO[] | undefined,
  topLimit: number,
  metric: PerformanceMetric,
) => {
  const rankedAgents = safeArray<AgentAggregateTopAgentVO>(topAgents).slice(0, topLimit)

  return {
    agents: rankedAgents,
    labels: rankedAgents.map((item) => `#${item.agentId}`),
    values: rankedAgents.map((item) => getMetricValue(item, metric)),
  }
}
