import { defineComponent, h, nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  routerPushSpy,
  loginMutateSpy,
  oauth2AuthUrlSpy,
  oauthWindowCloseSpy,
  captchaRefetchSpy,
  convertSpy,
  notificationErrorSpy,
  captchaDataState,
  captchaLoadingState,
} = vi.hoisted(() => ({
  routerPushSpy: vi.fn(),
  loginMutateSpy: vi.fn(),
  oauth2AuthUrlSpy: vi.fn(),
  oauthWindowCloseSpy: vi.fn(),
  captchaRefetchSpy: vi.fn(),
  convertSpy: vi.fn(),
  notificationErrorSpy: vi.fn(),
  captchaDataState: {
    value: {
      id: 'captcha-id-1',
      image: 'data:image/png;base64,abc',
    },
  },
  captchaLoadingState: {
    value: false,
  },
}))

const FRONTEND_ORIGIN = 'https://frontend.example.com'

const captchaDataRefLike = {
  __v_isRef: true,
  get value() {
    return captchaDataState.value
  },
  set value(nextValue) {
    captchaDataState.value = nextValue
  },
}

const captchaLoadingRefLike = {
  __v_isRef: true,
  get value() {
    return captchaLoadingState.value
  },
  set value(nextValue) {
    captchaLoadingState.value = nextValue
  },
}

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPushSpy,
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/modules/user/application/hooks/useLogin', () => ({
  useLogin: () => ({
    mutate: loginMutateSpy,
    isPending: { value: false },
  }),
}))

vi.mock('@/modules/user/application/hooks/useOauth2AuthorizationUrl', () => ({
  useOauth2AuthorizationUrl: (platform: string) => oauth2AuthUrlSpy(platform),
}))

vi.mock('@/modules/user/application/ui-mappers', () => ({
  convertUIToSignInForm: (payload: unknown) => convertSpy(payload),
}))

vi.mock('@/app/infrastructure/request/get-frontend-url', () => ({
  getFrontendOrigin: () => FRONTEND_ORIGIN,
}))

vi.mock('@/modules/captcha/application/hooks/useCaptcha', () => ({
  useCaptcha: () => ({
    data: captchaDataRefLike,
    refetch: captchaRefetchSpy,
    isLoading: captchaLoadingRefLike,
  }),
}))

vi.mock('@/_utils/discrete_naive_api', () => ({
  notification: {
    error: notificationErrorSpy,
  },
}))

vi.mock('@vicons/ionicons5', () => ({
  LogoGithub: defineComponent({
    name: 'LogoGithub',
    setup() {
      return () => h('i', { 'data-test': 'icon-github' })
    },
  }),
  LogoWechat: defineComponent({
    name: 'LogoWechat',
    setup() {
      return () => h('i', { 'data-test': 'icon-wechat' })
    },
  }),
  RefreshOutline: defineComponent({
    name: 'RefreshOutline',
    setup() {
      return () => h('i', { 'data-test': 'icon-refresh' })
    },
  }),
}))

vi.mock('naive-ui', () => ({
  NForm: defineComponent({
    name: 'NForm',
    setup(_, { slots }) {
      return () => h('form', { 'data-test': 'n-form' }, slots.default?.())
    },
  }),
  NFormItem: defineComponent({
    name: 'NFormItem',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-form-item' }, slots.default?.())
    },
  }),
  NInput: defineComponent({
    name: 'NInput',
    inheritAttrs: false,
    props: {
      value: {
        type: String,
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('input', {
          'data-test': 'n-input',
          value: props.value,
          onInput: (event: Event) => {
            emit('update:value', (event.target as HTMLInputElement).value)
          },
        })
    },
  }),
  NCheckbox: defineComponent({
    name: 'NCheckbox',
    props: {
      checked: {
        type: Boolean,
        required: false,
      },
    },
    emits: ['update:checked'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            'data-test': 'n-checkbox',
            type: 'button',
            onClick: () => emit('update:checked', !props.checked),
          },
          slots.default?.(),
        )
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    setup(_, { slots, attrs }) {
      return () =>
        h(
          'button',
          {
            'data-test': 'n-button',
            type: 'button',
            onClick: attrs.onClick as (() => void) | undefined,
          },
          slots.default?.(),
        )
    },
  }),
  NDivider: defineComponent({
    name: 'NDivider',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-divider' }, slots.default?.())
    },
  }),
}))

import LoginView from '@/views/unauth/LoginView'

const findButtonByText = (wrapper: VueWrapper, text: string) => {
  const button = wrapper.findAll('button').find((item) => item.text().includes(text))
  if (!button) {
    throw new Error(`button not found: ${text}`)
  }
  return button
}

const findLinkByText = (wrapper: VueWrapper, text: string) => {
  const link = wrapper.findAll('a').find((item) => item.text().includes(text))
  if (!link) {
    throw new Error(`link not found: ${text}`)
  }
  return link
}

describe('LoginView', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let mountedWrappers: Array<VueWrapper>

  const mountView = () => {
    const wrapper = mount(LoginView)
    mountedWrappers.push(wrapper)
    return wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mountedWrappers = []
    captchaDataState.value = {
      id: 'captcha-id-1',
      image: 'data:image/png;base64,abc',
    }
    captchaLoadingState.value = false
    convertSpy.mockImplementation((payload) => ({
      ...(payload as Record<string, unknown>),
      mapped: true,
    }))
    oauth2AuthUrlSpy.mockReturnValue({
      close: oauthWindowCloseSpy,
    })

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    for (const wrapper of mountedWrappers) {
      wrapper.unmount()
    }
    consoleErrorSpy.mockRestore()
  })

  it('submits local login with converted payload and latest captchaKey', async () => {
    const wrapper = mountView()

    const inputs = wrapper.findAll('input[data-test="n-input"]')
    await inputs[0].setValue(' 13800138000 ')
    await inputs[1].setValue('pwd-123')
    await inputs[2].setValue(' 1234 ')

    await wrapper.get('[data-test="n-checkbox"]').trigger('click')
    await findButtonByText(wrapper, 'auth.action.login').trigger('click')

    expect(convertSpy).toHaveBeenCalledWith({
      phone: '13800138000',
      password: 'pwd-123',
      captcha: '1234',
      captchaKey: 'captcha-id-1',
      remember: true,
    })
    expect(loginMutateSpy).toHaveBeenCalledWith({
      mode: 'local',
      data: {
        phone: '13800138000',
        password: 'pwd-123',
        captcha: '1234',
        captchaKey: 'captcha-id-1',
        remember: true,
        mapped: true,
      },
    })
  })

  it('refreshes captcha when captcha area is clicked', async () => {
    const wrapper = mountView()

    await wrapper.get('div.w-28').trigger('click')

    expect(captchaRefetchSpy).toHaveBeenCalledTimes(1)
  })

  it('processes oauth2 token message from trusted origin and closes popup', async () => {
    const wrapper = mountView()

    await findButtonByText(wrapper, 'GitHub').trigger('click')
    expect(oauth2AuthUrlSpy).toHaveBeenCalledWith('github')

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: FRONTEND_ORIGIN,
        data: {
          token: 'oauth2-token-1',
        },
      }),
    )

    await nextTick()

    expect(loginMutateSpy).toHaveBeenCalledWith({
      mode: 'oauth2',
      token: 'oauth2-token-1',
    })
    expect(oauthWindowCloseSpy).toHaveBeenCalledTimes(1)
  })

  it('shows oauth error notification when callback url indicates failure', async () => {
    const wrapper = mountView()

    await findButtonByText(wrapper, 'GitHub').trigger('click')

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: FRONTEND_ORIGIN,
        data: {
          url: '/oauth2/callback?error=access_denied',
        },
      }),
    )

    await nextTick()

    expect(notificationErrorSpy).toHaveBeenCalledWith({
      title: 'auth.oauth.error',
      content: 'auth.oauth.errorMeta',
      duration: 2500,
    })
    expect(oauthWindowCloseSpy).toHaveBeenCalledTimes(1)
  })

  it('ignores message from unknown origin', async () => {
    const wrapper = mountView()

    await findButtonByText(wrapper, 'GitHub').trigger('click')

    window.dispatchEvent(
      new MessageEvent('message', {
        origin: 'https://unknown.example.com',
        data: {
          token: 'bad-token',
        },
      }),
    )

    await nextTick()

    expect(consoleErrorSpy).toHaveBeenCalled()
    expect(loginMutateSpy).not.toHaveBeenCalledWith({ mode: 'oauth2', token: 'bad-token' })
    expect(notificationErrorSpy).not.toHaveBeenCalled()
    expect(oauthWindowCloseSpy).not.toHaveBeenCalled()
  })

  it('navigates to password recovery and register pages', async () => {
    const wrapper = mountView()

    await findLinkByText(wrapper, 'auth.action.forgotPassword').trigger('click')
    await findLinkByText(wrapper, 'auth.action.signup').trigger('click')

    expect(routerPushSpy).toHaveBeenNthCalledWith(1, { name: 'password-recovery' })
    expect(routerPushSpy).toHaveBeenNthCalledWith(2, { name: 'register' })
  })
})
