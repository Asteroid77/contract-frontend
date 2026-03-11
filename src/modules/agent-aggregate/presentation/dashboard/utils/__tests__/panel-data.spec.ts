import { describe, expect, it } from 'vitest'
import {
  hasFunnelPanelData,
  hasOverviewPanelData,
} from '@/modules/agent-aggregate/presentation/dashboard/utils/panel-data'

describe('panel-data helpers', () => {
  it('treats an all-zero overview payload with no regions as empty', () => {
    expect(
      hasOverviewPanelData({
        agentCount: 0,
        yearUsableChargeTotal: 0,
        filingCount: 0,
        signingCount: 0,
        regions: [],
      }),
    ).toBe(false)
  })

  it('treats overview payload with aggregate values as ready', () => {
    expect(
      hasOverviewPanelData({
        agentCount: 12,
        yearUsableChargeTotal: 0,
        filingCount: 0,
        signingCount: 0,
        regions: [],
      }),
    ).toBe(true)
  })

  it('treats an all-zero funnel payload with no structure as empty', () => {
    expect(
      hasFunnelPanelData({
        agentCount: 0,
        filingCount: 0,
        signingCount: 0,
        regions: [],
        levels: [],
      }),
    ).toBe(false)
  })

  it('treats funnel payload with counts or levels as ready', () => {
    expect(
      hasFunnelPanelData({
        agentCount: 0,
        filingCount: 0,
        signingCount: 3,
        regions: [],
        levels: [],
      }),
    ).toBe(true)
  })
})
