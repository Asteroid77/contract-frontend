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

  it('posts token message to opener when token exists', () => {
    routeState.query = {
      token: 'token-abc',
    }
    routeState.fullPath = '/oauth2/callback?token=token-abc'

    const wrapper = mount(Oauth2CallbackView)

    expect(postMessageSpy).toHaveBeenCalledWith(
      {
        token: 'token-abc',
        url: '/oauth2/callback?token=token-abc',
      },
      'https://frontend.example.com',
    )
    expect(wrapper.text()).toContain('auth.oauth.callback')
  })

  it('shows error title when error query exists and skips token post', () => {
    routeState.query = {
      error: 'oauth failed',
    }

    const wrapper = mount(Oauth2CallbackView)

    expect(wrapper.text()).toContain('oauth failed')
    expect(postMessageSpy).not.toHaveBeenCalled()
  })
})
