import { agentAggregateRepository } from '../infrastructure/agent-aggregate-repository'
import type { AgentAggregatePerformanceParams, AgentAggregateTrendParams } from '../domain/types'

export const agentAggregateService = {
  getOverview: () => agentAggregateRepository.getOverview(),
  getFunnel: () => agentAggregateRepository.getFunnel(),
  getTrend: (params: AgentAggregateTrendParams = {}) => agentAggregateRepository.getTrend(params),
  getPerformance: (params: AgentAggregatePerformanceParams = {}) =>
    agentAggregateRepository.getPerformance(params),
  getStructure: () => agentAggregateRepository.getStructure(),
  getRenewal: () => agentAggregateRepository.getRenewal(),
}
