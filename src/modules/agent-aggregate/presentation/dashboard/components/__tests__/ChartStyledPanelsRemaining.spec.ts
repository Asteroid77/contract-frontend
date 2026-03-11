import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

const { chartOptions } = vi.hoisted(() => ({
  chartOptions: [] as unknown[],
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale: ref('zh-CN'),
    t: (key: string) => key,
  }),
}))

vi.mock('naive-ui', () => ({
  NSkeleton: defineComponent({
    name: 'NSkeleton',
    setup() {
      return () => h('div', { 'data-test': 'skeleton' })
    },
  }),
  NStatistic: defineComponent({
    name: 'NStatistic',
    props: {
      label: { type: String, required: false },
      value: { type: String, required: false },
    },
    setup(props) {
      return () => h('div', { 'data-test': 'stat', 'data-label': props.label, 'data-value': props.value })
    },
  }),
  NTag: defineComponent({
    name: 'NTag',
    setup(_props, { slots }) {
      return () => h('span', { 'data-test': 'tag' }, slots.default?.())
    },
  }),
}))

vi.mock('@/modules/agent-aggregate/presentation/dashboard/charts/echarts', () => ({
  VChart: defineComponent({
    name: 'VChart',
    props: {
      option: {
        type: Object,
        required: false,
      },
    },
    setup(props) {
      chartOptions.push(props.option)
      return () => h('div', { 'data-test': 'chart' })
    },
  }),
}))

vi.mock('@/modules/agent-aggregate/presentation/dashboard/components/DashboardPanelFrame.vue', () => ({
  default: defineComponent({
    name: 'DashboardPanelFrame',
    props: {
      state: {
        type: Object,
        required: true,
      },
    },
    setup(_props, { slots }) {
      return () => h('section', { 'data-test': 'panel-frame' }, [slots['header-right']?.(), slots.default?.()])
    },
  }),
}))

import FunnelPanel from '@/modules/agent-aggregate/presentation/dashboard/components/FunnelPanel.vue'
import OverviewPanel from '@/modules/agent-aggregate/presentation/dashboard/components/OverviewPanel.vue'
import RenewalPanel from '@/modules/agent-aggregate/presentation/dashboard/components/RenewalPanel.vue'
import StructurePanel from '@/modules/agent-aggregate/presentation/dashboard/components/StructurePanel.vue'

describe('styled remaining chart panels', () => {
  beforeEach(() => {
    chartOptions.length = 0
  })

  it('applies polished bar styling to overview chart', () => {
    const query = {
      isLoading: ref(false),
      isError: ref(false),
      data: ref({
        agentCount: 4,
        yearUsableChargeTotal: 120,
        filingCount: 3,
        signingCount: 2,
        regions: [{ regionCode: 'HZ', agentCount: 4, filingCount: 3, signingCount: 2, yearUsableChargeTotal: 120 }],
      }),
      error: ref(null),
      refetch: vi.fn(),
      isFetching: computed(() => false),
    }

    mount(OverviewPanel, { props: { query } })

    const option = chartOptions.at(-1) as {
      tooltip?: Record<string, unknown>
      series?: Array<Record<string, unknown>>
    }

    expect(option.tooltip?.backgroundColor).toBe('#ffffff')
    expect(option.series?.[0].showBackground).toBe(true)
    expect(option.series?.[0].itemStyle).toEqual(expect.objectContaining({ borderRadius: 999 }))
  })

  it('applies restrained cold-tech styling to funnel chart', () => {
    const query = {
      isLoading: ref(false),
      isError: ref(false),
      data: ref({
        agentCount: 10,
        filingCount: 8,
        signingCount: 5,
        regions: [],
        levels: [],
      }),
      error: ref(null),
      refetch: vi.fn(),
      isFetching: computed(() => false),
    }

    mount(FunnelPanel, { props: { query } })

    const option = chartOptions.at(-1) as {
      tooltip?: Record<string, unknown>
      series?: Array<Record<string, unknown>>
    }

    expect(option.tooltip?.backgroundColor).toBe('#ffffff')
    expect(option.series?.[0].itemStyle).toEqual(expect.objectContaining({ borderRadius: 14 }))
    expect(option.series?.[0].label).toEqual(expect.objectContaining({ fontWeight: 600 }))
  })

  it('applies polished legend and mixed-series styling to renewal chart', () => {
    const query = {
      isLoading: ref(false),
      isError: ref(false),
      data: ref({
        windows: [
          { windowDays: 30, expiringCount: 4, expiringYearUsableChargeTotal: 100, renewedCount: 2, renewalRate: 0.5 },
        ],
      }),
      error: ref(null),
      refetch: vi.fn(),
      isFetching: computed(() => false),
    }

    mount(RenewalPanel, { props: { query } })

    const option = chartOptions.at(-1) as {
      tooltip?: Record<string, unknown>
      legend?: Record<string, unknown>
      series?: Array<Record<string, unknown>>
    }

    expect(option.tooltip?.backgroundColor).toBe('#ffffff')
    expect(option.legend?.icon).toBe('roundRect')
    expect(option.series?.[0].itemStyle).toEqual(expect.objectContaining({ borderRadius: 999 }))
    expect(option.series?.[2].areaStyle).toEqual(expect.objectContaining({ opacity: 0.14 }))
  })

  it('applies polished bar styling to structure chart', () => {
    const query = {
      isLoading: ref(false),
      isError: ref(false),
      data: ref({
        totalAgentCount: 8,
        maxLevel: 4,
        avgLevel: 2.5,
        headLevelAgentCount: 2,
        headLevelAgentRatio: 0.25,
        topHeavyRisk: false,
        levels: [{ level: 1, agentCount: 8, ratio: 1 }],
      }),
      error: ref(null),
      refetch: vi.fn(),
      isFetching: computed(() => false),
    }

    mount(StructurePanel, { props: { query } })

    const option = chartOptions.at(-1) as {
      tooltip?: Record<string, unknown>
      series?: Array<Record<string, unknown>>
    }

    expect(option.tooltip?.backgroundColor).toBe('#ffffff')
    expect(option.series?.[0].showBackground).toBe(true)
    expect(option.series?.[0].itemStyle).toEqual(expect.objectContaining({ borderRadius: 999 }))
  })
})
