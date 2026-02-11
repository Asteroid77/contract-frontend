import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { routeState } = vi.hoisted(() => ({
  routeState: {
    query: {} as Record<string, unknown>,
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/modules/approval/presentation/approval/ApprovalTemplate', () => ({
  default: defineComponent({
    name: 'ApprovalTemplate',
    props: {
      instanceId: {
        type: Number,
        required: false,
      },
      template: {
        type: String,
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('section', {
          'data-test': 'approval-template',
          'data-instance-id': String(props.instanceId),
          'data-template': props.template,
        })
    },
  }),
}))

vi.mock('naive-ui', () => ({
  NResult: defineComponent({
    name: 'NResult',
    props: {
      status: {
        type: String,
        required: false,
      },
      title: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () => h('div', { 'data-test': 'n-result', 'data-status': props.status, 'data-title': props.title }, slots.footer?.())
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    setup(_, { slots }) {
      return () => h('button', slots.default?.())
    },
  }),
}))

import ApprovalDetailView from '@/views/auth/ApprovalDetailView.vue'

describe('ApprovalDetailView', () => {
  beforeEach(() => {
    routeState.query = {}
  })

  it('renders error result when instanceId is invalid', () => {
    routeState.query = {
      instanceId: 'not-a-number',
      template: '用户信息审批',
    }

    const wrapper = mount(ApprovalDetailView)

    expect(wrapper.find('[data-test="n-result"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="approval-template"]').exists()).toBe(false)
  })

  it('renders error result when template is missing', () => {
    routeState.query = {
      instanceId: '123',
    }

    const wrapper = mount(ApprovalDetailView)

    expect(wrapper.find('[data-test="n-result"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="approval-template"]').exists()).toBe(false)
  })

  it('renders approval template with parsed instance id and template', () => {
    routeState.query = {
      instanceId: '456',
      template: '用户信息审批',
    }

    const wrapper = mount(ApprovalDetailView)

    const template = wrapper.get('[data-test="approval-template"]')
    expect(template.attributes('data-instance-id')).toBe('456')
    expect(template.attributes('data-template')).toBe('用户信息审批')
    expect(wrapper.find('[data-test="n-result"]').exists()).toBe(false)
  })
})
