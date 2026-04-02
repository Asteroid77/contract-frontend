import { describe, expect, it } from 'vitest'
import { buildPerformanceChartData } from '@/modules/agent-aggregate/presentation/dashboard/utils/performance-chart'

describe('buildPerformanceChartData', () => {
  it('keeps backend ranking order when switching displayed metric', () => {
    const result = buildPerformanceChartData(
      [
        {
          agentId: 101,
          userId: 1,
          level: 1,
          signingCount: 12,
          filingCount: 1,
          yearUsableChargeTotal: 20,
        },
        {
          agentId: 202,
          userId: 2,
          level: 2,
          signingCount: 8,
          filingCount: 99,
          yearUsableChargeTotal: 500,
        },
      ],
      10,
      'yearUsableChargeTotal',
    )

    expect(result.labels).toEqual(['#101', '#202'])
    expect(result.values).toEqual([20, 500])
  })

  it('truncates by top limit without re-sorting', () => {
    const result = buildPerformanceChartData(
      [
        {
          agentId: 101,
          userId: 1,
          level: 1,
          signingCount: 12,
          filingCount: 1,
          yearUsableChargeTotal: 20,
        },
        {
          agentId: 202,
          userId: 2,
          level: 2,
          signingCount: 8,
          filingCount: 99,
          yearUsableChargeTotal: 500,
        },
      ],
      1,
      'filingCount',
    )

    expect(result.labels).toEqual(['#101'])
    expect(result.values).toEqual([1])
  })
})
