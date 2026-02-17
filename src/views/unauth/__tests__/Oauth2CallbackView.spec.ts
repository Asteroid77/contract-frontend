import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { routeState, postMessageSpy } = vi.hoisted(() => ({
  routeState: {
    query: {} as Record<string, unknown>,
    fullPath: '/oauth2/callback',
  },
  postMessageSpy: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/app/infrastructure/request/get-frontend-url', () => ({
  getFrontendOrigin: () => 'https://frontend.example.com',
}))

import Oauth2CallbackView from '@/views/unauth/Oauth2CallbackView.vue'

describe('Oauth2CallbackView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.query = {}
    routeState.fullPath = '/oauth2/callback'

    Object.defineProperty(window, 'opener', {
      value: {
        postMessage: postMessageSpy,
      },
      configurable: true,
    })
  })

  it('posts authCode message to opener when authCode exists', () => {
    routeState.query = {
      authCode: 'auth-code-abc',
    }
    routeState.fullPath = '/oauth2/callback?authCode=auth-code-abc'

    const wrapper = mount(Oauth2CallbackView)

    expect(postMessageSpy).toHaveBeenCalledWith(
      {
        authCode: 'auth-code-abc',
      },
      'https://frontend.example.com',
    )
    expect(postMessageSpy).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('auth.oauth.callback')
  })

  it('shows error title and posts error payload when error query exists', () => {
    routeState.query = {
      error: 'oauth failed',
    }
    routeState.fullPath = '/oauth2/callback?error=oauth%20failed'

    const wrapper = mount(Oauth2CallbackView)

    expect(wrapper.text()).toContain('oauth failed')
    expect(postMessageSpy).toHaveBeenCalledWith(
      {
        error: 'oauth failed',
        url: '/oauth2/callback',
      },
      'https://frontend.example.com',
    )
    expect(postMessageSpy).toHaveBeenCalledTimes(1)
  })

  it('skips postMessage when opener is missing', () => {
    routeState.query = {
      authCode: 'auth-code-abc',
    }

    Object.defineProperty(window, 'opener', {
      value: null,
      configurable: true,
    })

    const wrapper = mount(Oauth2CallbackView)

    expect(postMessageSpy).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('auth.oauth.callback')
  })
})
