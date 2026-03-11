import { createPrefixedEndpoints } from '@/modules/shared/infrastructure/api/api-prefix-generator'

export const AGENT_AGGREGATE_ENDPOINTS = createPrefixedEndpoints('/agent/aggregate', {
  OVERVIEW: '/overview',
  FUNNEL: '/funnel',
  TREND: '/trend',
  PERFORMANCE: '/performance',
  STRUCTURE: '/structure',
  RENEWAL: '/renewal',
})
