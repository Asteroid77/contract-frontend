import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { routeState, accountState } = vi.hoisted(() => ({
  routeState: {
    meta: {} as Record<string, unknown>,
  },
  accountState: {
    isAuth: false,
    isLoadedData: true,
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
}))

vi.mock('@/modules/user/application/stores/useAccountStore', () => ({
  useAccountStore: () => accountState,
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
    accountState.isAuth = false
    accountState.isLoadedData = true
  })

  it('shows loading spinner when authenticated user data is not loaded', () => {
    accountState.isAuth = true
    accountState.isLoadedData = false

    const wrapper = createWrapper()

    expect(wrapper.find('[data-test="n-spin"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="auth-layout"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="unauth-layout"]').exists()).toBe(false)
  })

  it('uses unauth layout when route meta.layout is unauth', () => {
    routeState.meta = {
      layout: 'unauth',
    }

    const wrapper = createWrapper()

    expect(wrapper.find('[data-test="unauth-layout"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="auth-layout"]').exists()).toBe(false)
  })

  it('uses auth layout when route meta.layout is auth', () => {
    routeState.meta = {
      layout: 'auth',
    }

    const wrapper = createWrapper()

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

  it('falls back to auth layout when requiresAuth is missing', () => {
    routeState.meta = {}

    const wrapper = createWrapper()

    expect(wrapper.find('[data-test="auth-layout"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="unauth-layout"]').exists()).toBe(false)
  })
})
