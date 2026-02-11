import { defineComponent, h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  routerPushSpy,
  registerMutateSpy,
  smsMutateSpy,
  messageWarningSpy,
  messageErrorSpy,
  convertSpy,
  smsCodePendingRef,
  registerPendingRef,
  smsCodeDataRef,
} = vi.hoisted(() => ({
  routerPushSpy: vi.fn(),
  registerMutateSpy: vi.fn(),
  smsMutateSpy: vi.fn(),
  messageWarningSpy: vi.fn(),
  messageErrorSpy: vi.fn(),
  convertSpy: vi.fn(),
  smsCodePendingRef: { value: false },
  registerPendingRef: { value: false },
  smsCodeDataRef: { value: { bizId: 'biz-1' } },
}))

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

vi.mock('@/modules/user/application/hooks/useRegister', () => ({
  useRegister: () => ({
    mutate: registerMutateSpy,
    isPending: registerPendingRef,
  }),
}))

vi.mock('@/modules/captcha/application/hooks/useSMS', () => ({
  useSMS: () => ({
    getSendBtnLabelText: (phone: string) => ({ value: `send-${phone}` }),
    getSMSCoolDownSecond: () => ({ value: 0 }),
    sendSMSCode: () => ({
      mutate: smsMutateSpy,
      isPending: smsCodePendingRef,
      data: smsCodeDataRef,
    }),
  }),
}))

vi.mock('@/modules/user/application/ui-mappers', () => ({
  convertUIToRegisterForm: (payload: unknown) => convertSpy(payload),
}))

vi.mock('@/_utils/discrete_naive_api', () => ({
  message: {
    warning: messageWarningSpy,
    error: messageErrorSpy,
  },
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
  NButton: defineComponent({
    name: 'NButton',
    inheritAttrs: false,
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
}))

import RegisterView from '@/views/unauth/RegisterView'

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

describe('RegisterView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    smsCodePendingRef.value = false
    registerPendingRef.value = false
    smsCodeDataRef.value = {
      bizId: 'biz-1',
    }
    convertSpy.mockImplementation((payload) => ({
      ...(payload as Record<string, unknown>),
      mapped: true,
    }))
  })

  it('warns when sending sms code without phone', async () => {
    const wrapper = mount(RegisterView)

    await findButtonByText(wrapper, 'common.action.send').trigger('click')

    expect(messageWarningSpy).toHaveBeenCalledWith('auth.validation.verifyPhoneFirst')
    expect(smsMutateSpy).not.toHaveBeenCalled()
  })

  it('sends sms code when phone exists', async () => {
    const wrapper = mount(RegisterView)

    const inputs = wrapper.findAll('input[data-test="n-input"]')
    await inputs[0].setValue('13800138000')

    await findButtonByText(wrapper, 'send-13800138000').trigger('click')

    expect(smsMutateSpy).toHaveBeenCalledWith('13800138000')
  })

  it('shows error and blocks submit when passwords mismatch', async () => {
    const wrapper = mount(RegisterView)

    const inputs = wrapper.findAll('input[data-test="n-input"]')
    await inputs[2].setValue('password-1')
    await inputs[3].setValue('password-2')

    await findButtonByText(wrapper, 'auth.register.submit').trigger('click')

    expect(messageErrorSpy).toHaveBeenCalledWith('auth.validation.passwordMismatch')
    expect(registerMutateSpy).not.toHaveBeenCalled()
  })

  it('submits register payload with trim and sms bizId', async () => {
    const wrapper = mount(RegisterView)

    const inputs = wrapper.findAll('input[data-test="n-input"]')
    await inputs[0].setValue(' 13800138000 ')
    await inputs[1].setValue(' 123456 ')
    await inputs[2].setValue('pwd-123')
    await inputs[3].setValue('pwd-123')

    await findButtonByText(wrapper, 'auth.register.submit').trigger('click')

    expect(convertSpy).toHaveBeenCalledWith({
      phone: '13800138000',
      password: 'pwd-123',
      dbCheckPassword: 'pwd-123',
      code: '123456',
      bizId: 'biz-1',
    })
    expect(registerMutateSpy).toHaveBeenCalledWith({
      phone: '13800138000',
      password: 'pwd-123',
      dbCheckPassword: 'pwd-123',
      code: '123456',
      bizId: 'biz-1',
      mapped: true,
    })
  })

  it('navigates to login page from footer link', async () => {
    const wrapper = mount(RegisterView)

    await findLinkByText(wrapper, 'auth.register.footer.link').trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith({ name: 'login' })
  })
})
