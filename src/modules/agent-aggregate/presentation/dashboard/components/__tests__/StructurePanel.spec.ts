import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    locale: ref('zh-CN'),
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'domain.agentAggregate.dashboard.structure.headLevelRatio') {
        return '头部层级占比'
      }
      if (key === 'domain.agentAggregate.dashboard.structure.topHeavyRiskDetected') {
        return '检测到头部集中风险'
      }
      if (key === 'domain.agentAggregate.dashboard.structure.balanced') {
        return '结构均衡'
      }
      return params ? `${key}:${JSON.stringify(params)}` : key
    },
  }),
}))

vi.mock('naive-ui', () => ({
  NSkeleton: defineComponent({
    name: 'NSkeleton',
    setup() {
      return () => h('div', { 'data-test': 'skeleton' })
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
    setup() {
      return () => h('div', { 'data-test': 'chart' })
    },
  }),
}))

vi.mock(
  '@/modules/agent-aggregate/presentation/dashboard/components/DashboardPanelFrame.vue',
  () => ({
    default: defineComponent({
      name: 'DashboardPanelFrame',
      props: {
        state: {
          type: Object,
          required: true,
        },
      },
      setup(_props, { slots }) {
        return () =>
          h('section', { 'data-test': 'panel-frame' }, [
            slots['header-right']?.(),
            slots.default?.(),
          ])
      },
    }),
  }),
)

import StructurePanel from '@/modules/agent-aggregate/presentation/dashboard/components/StructurePanel.vue'

describe('StructurePanel', () => {
  it('renders head level ratio as visible header text', () => {
    const query = {
      isLoading: ref(false),
      isError: ref(false),
      data: ref({
        totalAgentCount: 8,
        maxLevel: 4,
        avgLevel: 2.5,
        headLevelAgentCount: 2,
        headLevelAgentRatio: 0.25,
        topHeavyRisk: true,
        levels: [{ level: 1, agentCount: 8, ratio: 1 }],
      }),
      error: ref(null),
      refetch: vi.fn(),
      isFetching: computed(() => false),
    }

    const wrapper = mount(StructurePanel, {
      props: { query },
    })

    const summary = wrapper.find('.agent-aggregate-dashboard__risk-summary')

    expect(summary.exists()).toBe(true)
    expect(summary.text()).toContain('头部层级占比')
    expect(summary.text()).toContain('25.0%')
  })
})
