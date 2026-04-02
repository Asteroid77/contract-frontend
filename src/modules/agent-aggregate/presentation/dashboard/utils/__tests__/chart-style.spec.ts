import { describe, expect, it } from 'vitest'
import {
  createDashboardBarSeries,
  createDashboardLegend,
  createDashboardLineSeries,
  createDashboardTooltip,
  createDashboardValueAxis,
} from '@/modules/agent-aggregate/presentation/dashboard/utils/chart-style'

describe('chart-style helpers', () => {
  it('builds restrained cold-tech tooltip and legend styles', () => {
    const tooltip = createDashboardTooltip({ trigger: 'axis', axisPointerType: 'line' })
    const legend = createDashboardLegend()

    expect(tooltip.backgroundColor).toBe('#ffffff')
    expect(tooltip.borderRadius).toBe(12)
    expect(tooltip.borderColor).toBe('#e2e8f0')
    expect(tooltip.className).toBe('agent-aggregate-dashboard__tooltip')
    expect(legend.icon).toBe('roundRect')
    expect(legend.itemWidth).toBe(10)
    expect(legend.textStyle?.fontSize).toBe(12)
  })

  it('builds axis styles with dashed split lines', () => {
    const valueAxis = createDashboardValueAxis()

    expect(valueAxis.splitLine?.lineStyle).toEqual(
      expect.objectContaining({ color: 'rgba(148, 163, 184, 0.18)', type: 'dashed' }),
    )
  })

  it('builds line and bar series with modern understated styling', () => {
    const line = createDashboardLineSeries({
      name: 'Agents',
      data: [1, 2, 3],
      color: '#2563eb',
      area: true,
    })
    const bar = createDashboardBarSeries({
      name: 'Charge',
      data: [4, 5, 6],
      colorStops: ['#bfdbfe', '#60a5fa'],
      yAxisIndex: 1,
    })

    expect(line.showSymbol).toBe(false)
    expect(line.lineStyle?.width).toBe(2.5)
    expect(line.animationDuration).toBe(560)
    expect(line.areaStyle).toEqual(expect.objectContaining({ opacity: 0.14 }))
    expect(line.emphasis).toEqual(expect.objectContaining({ focus: 'series' }))

    expect(bar.showBackground).toBe(true)
    expect(bar.animationDurationUpdate).toBe(280)
    expect(bar.itemStyle).toEqual(expect.objectContaining({ borderRadius: 999 }))
    expect(bar.itemStyle?.color).toEqual(expect.objectContaining({ type: 'linear' }))
  })
})
