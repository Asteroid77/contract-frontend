import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type Ref } from 'vue'
import { withQueryRequestContext } from '@/app/infrastructure/query/query-request-context'
import { agentAggregateService } from '../agent-aggregate-service'
import type { AgentAggregatePerformanceParams, AgentAggregateTrendParams } from '../../domain/types'

type QueryEnabledOption = { enabled?: Ref<boolean> | boolean }

const createQueryBaseOptions = (options?: QueryEnabledOption) => ({
  enabled: computed(() => unref(options?.enabled ?? true)),
  retry: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  meta: {
    skipGlobalErrorHandler: true,
  },
})

export const agentAggregateKeys = {
  ALL: ['agent-aggregate'] as const,
  OVERVIEW: ['agent-aggregate', 'overview'] as const,
  FUNNEL: ['agent-aggregate', 'funnel'] as const,
  TREND: (params: AgentAggregateTrendParams = {}) =>
    ['agent-aggregate', 'trend', { days: params.days }] as const,
  PERFORMANCE: (params: AgentAggregatePerformanceParams = {}) =>
    ['agent-aggregate', 'performance', { top: params.top }] as const,
  STRUCTURE: ['agent-aggregate', 'structure'] as const,
  RENEWAL: ['agent-aggregate', 'renewal'] as const,
}

export const useAgentAggregateOverview = (options?: { enabled?: Ref<boolean> | boolean }) => {
  return useQuery({
    queryKey: agentAggregateKeys.OVERVIEW,
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => agentAggregateService.getOverview()),
    ...createQueryBaseOptions(options),
    staleTime: 30 * 1000,
  })
}

export const useAgentAggregateFunnel = (options?: { enabled?: Ref<boolean> | boolean }) => {
  return useQuery({
    queryKey: agentAggregateKeys.FUNNEL,
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => agentAggregateService.getFunnel()),
    ...createQueryBaseOptions(options),
    staleTime: 30 * 1000,
  })
}

export const useAgentAggregateTrend = (
  params: Ref<AgentAggregateTrendParams> | AgentAggregateTrendParams,
  options?: { enabled?: Ref<boolean> | boolean },
) => {
  return useQuery({
    queryKey: computed(() => agentAggregateKeys.TREND(unref(params))),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () =>
        agentAggregateService.getTrend(unref(params)),
      ),
    ...createQueryBaseOptions(options),
    staleTime: 120 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

export const useAgentAggregatePerformance = (
  params: Ref<AgentAggregatePerformanceParams> | AgentAggregatePerformanceParams,
  options?: { enabled?: Ref<boolean> | boolean },
) => {
  return useQuery({
    queryKey: computed(() => agentAggregateKeys.PERFORMANCE(unref(params))),
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () =>
        agentAggregateService.getPerformance(unref(params)),
      ),
    ...createQueryBaseOptions(options),
    staleTime: 60 * 1000,
    placeholderData: (previousData) => previousData,
  })
}

export const useAgentAggregateStructure = (options?: { enabled?: Ref<boolean> | boolean }) => {
  return useQuery({
    queryKey: agentAggregateKeys.STRUCTURE,
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => agentAggregateService.getStructure()),
    ...createQueryBaseOptions(options),
    staleTime: 300 * 1000,
  })
}

export const useAgentAggregateRenewal = (options?: { enabled?: Ref<boolean> | boolean }) => {
  return useQuery({
    queryKey: agentAggregateKeys.RENEWAL,
    queryFn: (ctx) =>
      withQueryRequestContext(ctx.queryKey, ctx, () => agentAggregateService.getRenewal()),
    ...createQueryBaseOptions(options),
    staleTime: 300 * 1000,
  })
}
