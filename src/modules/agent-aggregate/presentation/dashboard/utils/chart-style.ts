import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts'
import type {
  GridComponentOption,
  LegendComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import { chartColor } from './chart-color'

type AxisPointerType = 'line' | 'shadow'

type LineSeriesInput = {
  name: string
  data: number[]
  color: string
  yAxisIndex?: number
  area?: boolean
}

type BarSeriesInput = {
  name: string
  data: number[]
  colorStops: [string, string] | string[]
  yAxisIndex?: number
  barMaxWidth?: number
  horizontal?: boolean
}

type GridInput = Partial<GridComponentOption>

type CategoryAxisInput = {
  data: string[]
  boundaryGap?: boolean
}

type ValueAxisInput = {
  name?: string
  formatter?: string | ((value: number) => string)
}

const themeTokens = () => ({
  textMain: chartColor('--color-text-main', '#0f172a'),
  textBody: chartColor('--color-text-body', '#334155'),
  textLight: chartColor('--color-text-light', '#64748b'),
  border: chartColor('--color-border', '#e2e8f0'),
  panelBg: chartColor('--color-bg-card', '#ffffff'),
  pointer: 'rgba(148, 163, 184, 0.10)',
  splitLine: 'rgba(148, 163, 184, 0.18)',
  shadow: 'rgba(15, 23, 42, 0.08)',
})

const normalizeHex = (color: string): string | null => {
  const trimmed = color.trim()
  if (!trimmed.startsWith('#')) {
    return null
  }

  const value = trimmed.slice(1)
  if (value.length === 3) {
    return value
      .split('')
      .map((item) => item + item)
      .join('')
  }

  if (value.length === 6) {
    return value
  }

  return null
}

const toRgba = (color: string, alpha: number): string => {
  const normalized = normalizeHex(color)
  if (!normalized) {
    return color
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const createDashboardSeriesAnimation = () => ({
  animationDuration: 560,
  animationDurationUpdate: 280,
  animationEasing: 'cubicOut' as const,
  animationEasingUpdate: 'quadraticOut' as const,
})

const getSeriesShadowTone = (colorStops: string[]) => colorStops.at(-1) ?? colorStops[0] ?? '#60a5fa'

export const createDashboardTooltip = ({
  trigger,
  axisPointerType,
}: {
  trigger: 'axis' | 'item'
  axisPointerType: AxisPointerType
}): TooltipComponentOption => {
  const tokens = themeTokens()

  return {
    trigger,
    confine: true,
    className: 'agent-aggregate-dashboard__tooltip',
    transitionDuration: 0.12,
    backgroundColor: tokens.panelBg,
    borderColor: tokens.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: [12, 14],
    textStyle: {
      color: tokens.textMain,
      fontSize: 12,
      fontWeight: 500,
    },
    extraCssText: `box-shadow: 0 10px 24px ${tokens.shadow};`,
    axisPointer:
      axisPointerType === 'shadow'
        ? {
            type: 'shadow',
            shadowStyle: {
              color: tokens.pointer,
            },
          }
        : {
            type: 'line',
            lineStyle: {
              color: tokens.border,
              width: 1,
              type: 'dashed' as const,
            },
          },
  }
}

export const createDashboardLegend = (): LegendComponentOption => {
  const tokens = themeTokens()

  return {
    top: 2,
    icon: 'roundRect',
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 12,
    textStyle: {
      color: tokens.textLight,
      fontSize: 12,
      fontWeight: 500,
      padding: [0, 0, 0, 2],
    },
  }
}

export const createDashboardGrid = (overrides: GridInput = {}): GridComponentOption => ({
  top: 28,
  right: 20,
  bottom: 18,
  left: 20,
  containLabel: true,
  ...overrides,
})

export const createDashboardCategoryAxis = ({
  data,
  boundaryGap = false,
}: CategoryAxisInput) => {
  const tokens = themeTokens()

  return {
    type: 'category' as const,
    data,
    boundaryGap,
    axisLabel: {
      color: tokens.textLight,
      fontSize: 12,
      margin: 10,
      hideOverlap: true,
    },
    axisTick: { show: false },
    axisLine: {
      lineStyle: {
        color: tokens.border,
      },
    },
  }
}

export const createDashboardValueAxis = ({
  name,
  formatter,
}: ValueAxisInput = {}) => {
  const tokens = themeTokens()

  return {
    type: 'value' as const,
    name,
    nameTextStyle: {
      color: tokens.textLight,
      fontSize: 11,
      padding: [0, 0, 10, 0],
    },
    axisLabel: {
      color: tokens.textLight,
      fontSize: 12,
      formatter,
    },
    axisTick: { show: false },
    axisLine: { show: false },
    splitLine: {
      lineStyle: {
        color: tokens.splitLine,
        type: 'dashed' as const,
      },
    },
  }
}

export const createDashboardLineSeries = ({
  name,
  data,
  color,
  yAxisIndex = 0,
  area = false,
}: LineSeriesInput): LineSeriesOption => ({
  ...createDashboardSeriesAnimation(),
  name,
  type: 'line',
  smooth: true,
  showSymbol: false,
  symbol: 'circle',
  symbolSize: 7,
  yAxisIndex,
  z: 3,
  data,
  lineStyle: {
    width: 2.5,
    color,
  },
  itemStyle: {
    color,
    borderColor: '#ffffff',
    borderWidth: 2,
  },
  emphasis: {
    focus: 'series',
    lineStyle: {
      width: 3,
    },
  },
  areaStyle: area
    ? {
        opacity: 0.14,
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: toRgba(color, 0.22) },
            { offset: 1, color: toRgba(color, 0) },
          ],
        },
      }
    : undefined,
})

export const createDashboardBarSeries = ({
  name,
  data,
  colorStops,
  yAxisIndex = 0,
  barMaxWidth = 14,
  horizontal = false,
}: BarSeriesInput): BarSeriesOption => {
  const shadowTone = getSeriesShadowTone(colorStops)

  return {
    ...createDashboardSeriesAnimation(),
    name,
    type: 'bar',
    yAxisIndex,
    data,
    z: 2,
    barMaxWidth,
    barMinHeight: 6,
    animationDelay: (dataIndex) => dataIndex * 36,
    showBackground: true,
    backgroundStyle: {
      color: 'rgba(148, 163, 184, 0.08)',
      borderRadius: 999,
    },
    itemStyle: {
      borderRadius: 999,
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: horizontal ? 1 : 0,
        y2: horizontal ? 0 : 1,
        colorStops: [
          { offset: 0, color: colorStops[0] },
          { offset: 1, color: colorStops[1] },
        ],
      },
      shadowBlur: 10,
      shadowColor: toRgba(shadowTone, 0.12),
    },
    emphasis: {
      focus: 'series',
      itemStyle: {
        shadowBlur: 14,
        shadowColor: toRgba(shadowTone, 0.18),
      },
    },
  }
}
