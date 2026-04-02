import type {
  AgentAggregateFunnelVO,
  AgentAggregateOverviewVO,
} from '@/modules/agent-aggregate/domain/types'
import { safeArray } from './safe-array'

const hasPositiveValue = (...values: Array<number | undefined>) => {
  return values.some((value) => (value ?? 0) > 0)
}

export const hasOverviewPanelData = (data: AgentAggregateOverviewVO | undefined): boolean => {
  if (!data) {
    return false
  }

  return (
    hasPositiveValue(
      data.agentCount,
      data.yearUsableChargeTotal,
      data.filingCount,
      data.signingCount,
    ) || safeArray(data.regions).length > 0
  )
}

export const hasFunnelPanelData = (data: AgentAggregateFunnelVO | undefined): boolean => {
  if (!data) {
    return false
  }

  return (
    hasPositiveValue(data.agentCount, data.filingCount, data.signingCount) ||
    safeArray(data.regions).length > 0 ||
    safeArray(data.levels).length > 0
  )
}
