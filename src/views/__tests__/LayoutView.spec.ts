import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { routeState } = vi.hoisted(() => ({
  routeState: {
    meta: {} as Record<string, unknown>,
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
}))

vi.mock('@/views/auth/AuthLayoutView.tsx', () => ({
  default: defineComponent({
    name: 'AuthLayoutMock',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'auth-layout' }, slots.default?.())
    },
  }),
}))

vi.mock('@/views/unauth/UnauthLayoutView', () => ({
  default: defineComponent({
    name: 'UnauthLayoutMock',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'unauth-layout' }, slots.default?.())
    },
  }),
}))

vi.mock('naive-ui', () => ({
  NSpin: defineComponent({
    name: 'NSpin',
    setup() {
      return () => h('div', { 'data-test': 'n-spin' })
    },
  }),
}))

import LayoutView from '@/views/LayoutView.vue'

const createWrapper = () =>
  mount(LayoutView, {
    global: {
      stubs: {
        RouterView: defineComponent({
          name: 'RouterViewStub',
          setup() {
            return () => h('div', { 'data-test': 'router-view' })
          },
        }),
      },
    },
  })

describe('LayoutView', () => {
  beforeEach(() => {
    routeState.meta = {}
  })

  it('uses unauth layout when route meta.layout is unauth', () => {
    routeState.meta = {
      layout: 'unauth',
    }

    const wrapper = createWrapper()

    expect(wrapper.find('[data-test="unauth-layout"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="auth-layout"]').exists()).toBe(false)
  })

  it('uses auth layout when route meta.layout is auth', async () => {
    routeState.meta = {
      layout: 'auth',
    }

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.find('[data-test="auth-layout"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="unauth-layout"]').exists()).toBe(false)
  })

  it('falls back to unauth layout when requiresAuth is false', () => {
    routeState.meta = {
      requiresAuth: false,
    }

    const wrapper = createWrapper()

    expect(wrapper.find('[data-test="unauth-layout"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="auth-layout"]').exists()).toBe(false)
  })

  it('falls back to auth layout when requiresAuth is missing', async () => {
    routeState.meta = {}

    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.find('[data-test="auth-layout"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="unauth-layout"]').exists()).toBe(false)
  })
})
