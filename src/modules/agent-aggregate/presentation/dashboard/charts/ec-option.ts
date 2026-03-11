import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption, FunnelSeriesOption, LineSeriesOption } from 'echarts/charts'
import type {
  GridComponentOption,
  LegendComponentOption,
  TooltipComponentOption,
} from 'echarts/components'

export type ECOption = ComposeOption<
  | GridComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | BarSeriesOption
  | LineSeriesOption
  | FunnelSeriesOption
> & {
  xAxis?: unknown
  yAxis?: unknown
}
