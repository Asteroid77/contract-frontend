export interface AgentAggregateTrendParams {
  days?: number
}

export interface AgentAggregatePerformanceParams {
  top?: number
}

export interface AgentAggregateRegionVO {
  regionCode: string
  agentCount: number
  filingCount: number
  signingCount: number
  yearUsableChargeTotal: number
}

export interface AgentAggregateOverviewVO {
  agentCount: number
  yearUsableChargeTotal: number
  filingCount: number
  signingCount: number
  regions: AgentAggregateRegionVO[]
}

export interface AgentAggregateFunnelVO {
  agentCount: number
  filingCount: number
  signingCount: number
  regions: AgentAggregateRegionVO[]
  levels: AgentAggregateFunnelLevelVO[]
}

export interface AgentAggregateFunnelLevelVO {
  level: number
  agentCount: number
  filingCount: number
  signingCount: number
  yearUsableChargeTotal: number
}

export interface AgentAggregateTrendVO {
  days: number
  points: AgentAggregateTrendPointVO[]
}

export interface AgentAggregateTrendPointVO {
  date: string
  newAgentCount: number
  filingCount: number
  signingCount: number
  yearUsableChargeTotal: number
}

export interface AgentAggregatePerformanceVO {
  totalAgentCount: number
  activeAgentCount: number
  activeAgentRatio: number
  avgSigningPerActiveAgent: number
  avgYearUsableChargePerActiveAgent: number
  topAgents: AgentAggregateTopAgentVO[]
}

export interface AgentAggregateTopAgentVO {
  agentId: number
  userId: number
  level: number
  signingCount: number
  filingCount: number
  yearUsableChargeTotal: number
}

export interface AgentAggregateStructureVO {
  totalAgentCount: number
  maxLevel: number
  avgLevel: number
  headLevelAgentCount: number
  headLevelAgentRatio: number
  topHeavyRisk: boolean
  levels: AgentAggregateStructureLevelVO[]
}

export interface AgentAggregateStructureLevelVO {
  level: number
  agentCount: number
  ratio: number
}

export interface AgentAggregateRenewalVO {
  windows: AgentAggregateRenewalWindowVO[]
}

export interface AgentAggregateRenewalWindowVO {
  windowDays: number
  expiringCount: number
  expiringYearUsableChargeTotal: number
  renewedCount: number
  renewalRate: number
}
