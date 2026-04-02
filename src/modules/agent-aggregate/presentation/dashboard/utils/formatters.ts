import { computed } from 'vue'
import type { Ref } from 'vue'

type Translate = (key: string, params?: Record<string, unknown>) => string

export const useDashboardFormatters = (locale: Ref<string>, t: Translate) => {
  const numberLocale = computed(() =>
    locale.value.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US',
  )

  const formatInteger = (value: number): string =>
    new Intl.NumberFormat(numberLocale.value).format(value)

  const normalizeRatePercent = (value: number): number => {
    if (value <= 1 && value >= 0) {
      return value * 100
    }
    return value
  }

  const formatPercent = (value: number): string => `${normalizeRatePercent(value).toFixed(1)}%`

  const formatWindowDays = (days: number): string =>
    t('domain.agentAggregate.dashboard.label.windowDays', { days })

  return { numberLocale, formatInteger, normalizeRatePercent, formatPercent, formatWindowDays }
}
