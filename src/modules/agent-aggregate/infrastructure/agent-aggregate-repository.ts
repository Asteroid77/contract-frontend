import { useRequest } from '@/modules/shared/infrastructure/useRequest'
import { AGENT_AGGREGATE_ENDPOINTS } from './agent-aggregate-endpoints'
import type {
  AgentAggregateFunnelVO,
  AgentAggregateOverviewVO,
  AgentAggregatePerformanceParams,
  AgentAggregatePerformanceVO,
  AgentAggregateRenewalVO,
  AgentAggregateStructureVO,
  AgentAggregateTrendParams,
  AgentAggregateTrendVO,
} from '../domain/types'

export const agentAggregateRepository = {
  getOverview: () =>
    useRequest<AgentAggregateOverviewVO>({
      url: AGENT_AGGREGATE_ENDPOINTS.OVERVIEW,
      method: 'get',
    }),

  getFunnel: () =>
    useRequest<AgentAggregateFunnelVO>({
      url: AGENT_AGGREGATE_ENDPOINTS.FUNNEL,
      method: 'get',
    }),

  getTrend: (params: AgentAggregateTrendParams = {}) =>
    useRequest<AgentAggregateTrendVO>({
      url: AGENT_AGGREGATE_ENDPOINTS.TREND,
      method: 'get',
      params,
    }),

  getPerformance: (params: AgentAggregatePerformanceParams = {}) =>
    useRequest<AgentAggregatePerformanceVO>({
      url: AGENT_AGGREGATE_ENDPOINTS.PERFORMANCE,
      method: 'get',
      params,
    }),

  getStructure: () =>
    useRequest<AgentAggregateStructureVO>({
      url: AGENT_AGGREGATE_ENDPOINTS.STRUCTURE,
      method: 'get',
    }),

  getRenewal: () =>
    useRequest<AgentAggregateRenewalVO>({
      url: AGENT_AGGREGATE_ENDPOINTS.RENEWAL,
      method: 'get',
    }),
}
