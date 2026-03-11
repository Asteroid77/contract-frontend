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
  NRadioGroup: defineComponent({
    name: 'NRadioGroup',
    setup(_props, { slots }) {
      return () => h('div', { 'data-test': 'radio-group' }, slots.default?.())
    },
  }),
  NRadioButton: defineComponent({
    name: 'NRadioButton',
    setup(_props, { slots }) {
      return () => h('button', { 'data-test': 'radio-button' }, slots.default?.())
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
      return () => h('section', { 'data-test': 'panel-frame' }, [slots['header-center']?.(), slots.default?.()])
    },
  }),
}))

import PerformancePanel from '@/modules/agent-aggregate/presentation/dashboard/components/PerformancePanel.vue'
import TrendPanel from '@/modules/agent-aggregate/presentation/dashboard/components/TrendPanel.vue'

describe('styled chart panels', () => {
  beforeEach(() => {
    chartOptions.length = 0
  })

  it('applies polished tooltip and series styles to trend chart', () => {
    const query = {
      isLoading: ref(false),
      isError: ref(false),
      data: ref({
        days: 30,
        points: [
          {
            date: '2026-03-01',
            newAgentCount: 1,
            filingCount: 2,
            signingCount: 3,
            yearUsableChargeTotal: 100,
          },
        ],
      }),
      error: ref(null),
      refetch: vi.fn(),
      isFetching: computed(() => false),
    }

    mount(TrendPanel, { props: { query } })

    const option = chartOptions.at(-1) as {
      tooltip?: Record<string, unknown>
      legend?: Record<string, unknown>
      series?: Array<Record<string, unknown>>
    }

    expect(option.tooltip?.backgroundColor).toBe('#ffffff')
    expect(option.legend?.icon).toBe('roundRect')
    expect(option.series?.[0].areaStyle).toEqual(expect.objectContaining({ opacity: 0.14 }))
    expect(option.series?.[3].itemStyle).toEqual(expect.objectContaining({ borderRadius: 999 }))
  })

  it('applies polished tooltip and bar styling to performance chart', () => {
    const query = {
      isLoading: ref(false),
      isError: ref(false),
      data: ref({
        totalAgentCount: 3,
        activeAgentCount: 2,
        activeAgentRatio: 0.66,
        avgSigningPerActiveAgent: 2,
        avgYearUsableChargePerActiveAgent: 200,
        topAgents: [
          {
            agentId: 101,
            userId: 1,
            level: 1,
            signingCount: 10,
            filingCount: 9,
            yearUsableChargeTotal: 300,
          },
        ],
      }),
      error: ref(null),
      refetch: vi.fn(),
      isFetching: computed(() => false),
    }

    mount(PerformancePanel, { props: { query, topLimit: 10 } })

    const option = chartOptions.at(-1) as {
      tooltip?: Record<string, unknown>
      series?: Array<Record<string, unknown>>
    }

    expect(option.tooltip?.backgroundColor).toBe('#ffffff')
    expect(option.series?.[0].showBackground).toBe(true)
    expect(option.series?.[0].itemStyle).toEqual(expect.objectContaining({ borderRadius: 999 }))
  })
})
