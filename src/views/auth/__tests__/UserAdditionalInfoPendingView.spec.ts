import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { routeState, routerPushSpy, routerReplaceSpy, latestStatusQueryState } = vi.hoisted(() => ({
  routeState: {
    query: {} as Record<string, unknown>,
  },
  routerPushSpy: vi.fn(),
  routerReplaceSpy: vi.fn(),
  latestStatusQueryState: {
    data: {
      value: null as any,
    },
    isLoading: {
      value: false,
    },
    isError: {
      value: false,
    },
    refetch: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push: routerPushSpy,
    replace: routerReplaceSpy,
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/modules/approval/application/hooks/useApprovalService', () => ({
  useLatestAdditionalInfoInstanceStatus: vi.fn(() => latestStatusQueryState),
}))

vi.mock('naive-ui', () => ({
  NFlex: defineComponent({
    name: 'NFlex',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-flex' }, slots.default?.())
    },
  }),
  NCard: defineComponent({
    name: 'NCard',
    setup(_, { slots }) {
      return () => h('section', { 'data-test': 'n-card' }, slots.default?.())
    },
  }),
  NSkeleton: defineComponent({
    name: 'NSkeleton',
    setup() {
      return () => h('div', { 'data-test': 'n-skeleton' })
    },
  }),
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
      description: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'div',
          {
            'data-test': 'n-result',
            'data-status': props.status,
            'data-title': props.title,
          },
          [slots.footer?.()],
        )
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    props: {
      disabled: {
        type: Boolean,
        required: false,
      },
      onClick: {
        type: Function,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'button',
          {
            disabled: props.disabled,
            onClick: props.onClick,
          },
          slots.default?.(),
        )
    },
  }),
}))

import UserAdditionalInfoPendingView from '@/views/auth/UserAdditionalInfoPendingView.vue'

describe('UserAdditionalInfoPendingView', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    routeState.query = {}

    latestStatusQueryState.data.value = {
      id: 88,
      status: 'pending',
    }
    latestStatusQueryState.isLoading.value = false
    latestStatusQueryState.isError.value = false
  })

  it('renders loading skeleton when status query is loading', () => {
    latestStatusQueryState.isLoading.value = true

    const wrapper = mount(UserAdditionalInfoPendingView)

    expect(wrapper.find('[data-test="n-skeleton"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="n-result"]').exists()).toBe(false)
  })

  it('renders error state and handles back/retry actions', async () => {
    latestStatusQueryState.isError.value = true

    const wrapper = mount(UserAdditionalInfoPendingView)

    const result = wrapper.get('[data-test="n-result"]')
    expect(result.attributes('data-status')).toBe('error')

    const buttons = wrapper.findAll('button')
    await buttons[0].trigger('click')
    await buttons[1].trigger('click')

    expect(routerReplaceSpy).toHaveBeenCalledWith({ name: 'user-profile' })
    expect(latestStatusQueryState.refetch).toHaveBeenCalledTimes(1)
  })

  it('navigates to approval detail using route query instanceId when present', async () => {
    routeState.query = {
      instanceId: '123',
    }

    const wrapper = mount(UserAdditionalInfoPendingView)

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith({
      name: 'approval-instance-detail',
      query: {
        template: '用户信息审批',
        instanceId: 123,
      },
    })
  })

  it('uses latest status instance id when route query instanceId is missing', async () => {
    latestStatusQueryState.data.value = {
      id: 456,
      status: 'pending',
    }

    const wrapper = mount(UserAdditionalInfoPendingView)

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith({
      name: 'approval-instance-detail',
      query: {
        template: '用户信息审批',
        instanceId: 456,
      },
    })
  })

  it('redirects to profile immediately when latest status is terminal', () => {
    latestStatusQueryState.data.value = {
      id: 1,
      status: 'approved',
    }

    mount(UserAdditionalInfoPendingView)

    expect(routerReplaceSpy).toHaveBeenCalledWith({ name: 'user-profile' })
  })
})
