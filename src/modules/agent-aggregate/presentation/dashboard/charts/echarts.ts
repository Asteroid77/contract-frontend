import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, FunnelChart, LineChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  FunnelChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
])

export { VChart }
