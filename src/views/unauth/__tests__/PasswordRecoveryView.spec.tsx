import { defineComponent, h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  routerPushSpy,
  recoveryMutateSpy,
  smsMutateSpy,
  messageWarningSpy,
  messageErrorSpy,
  convertSpy,
  smsCodePendingRef,
  recoveryPendingRef,
  smsCodeDataRef,
} = vi.hoisted(() => ({
  routerPushSpy: vi.fn(),
  recoveryMutateSpy: vi.fn(),
  smsMutateSpy: vi.fn(),
  messageWarningSpy: vi.fn(),
  messageErrorSpy: vi.fn(),
  convertSpy: vi.fn(),
  smsCodePendingRef: { value: false },
  recoveryPendingRef: { value: false },
  smsCodeDataRef: { value: { bizId: 'biz-2' } },
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

vi.mock('@/modules/user/application/hooks/usePassword', () => ({
  usePasswordRecovery: () => ({
    mutate: recoveryMutateSpy,
    isPending: recoveryPendingRef,
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
  convertUIToPasswordRecoveryForm: (payload: unknown) => convertSpy(payload),
}))

vi.mock('@/_utils/discrete_naive_api', () => ({
  message: {
    warning: messageWarningSpy,
    error: messageErrorSpy,
  },
}))

vi.mock('@vicons/ionicons5', () => ({
  ArrowBackOutline: defineComponent({
    name: 'ArrowBackOutline',
    setup() {
      return () => h('i', { 'data-test': 'icon-arrow-back' })
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

import PasswordRecoveryView from '@/views/unauth/PasswordRecoveryView'

const findButtonByText = (wrapper: VueWrapper, text: string) => {
  const button = wrapper.findAll('button').find((item) => item.text().includes(text))
  if (!button) {
    throw new Error(`button not found: ${text}`)
  }
  return button
}

describe('PasswordRecoveryView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    smsCodePendingRef.value = false
    recoveryPendingRef.value = false
    smsCodeDataRef.value = {
      bizId: 'biz-2',
    }
    convertSpy.mockImplementation((payload) => ({
      ...(payload as Record<string, unknown>),
      mapped: true,
    }))
  })

  it('navigates back to login when clicking back action', async () => {
    const wrapper = mount(PasswordRecoveryView)

    await findButtonByText(wrapper, 'auth.action.backToLogin').trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith({ name: 'login' })
  })

  it('warns when sending sms code without phone', async () => {
    const wrapper = mount(PasswordRecoveryView)

    await findButtonByText(wrapper, 'common.action.send').trigger('click')

    expect(messageWarningSpy).toHaveBeenCalledWith('auth.validation.verifyPhoneFirst')
    expect(smsMutateSpy).not.toHaveBeenCalled()
  })

  it('sends sms code when phone exists', async () => {
    const wrapper = mount(PasswordRecoveryView)

    const inputs = wrapper.findAll('input[data-test="n-input"]')
    await inputs[0].setValue('13800138000')

    await findButtonByText(wrapper, 'send-13800138000').trigger('click')

    expect(smsMutateSpy).toHaveBeenCalledWith('13800138000')
  })

  it('shows error and blocks submit when passwords mismatch', async () => {
    const wrapper = mount(PasswordRecoveryView)

    const inputs = wrapper.findAll('input[data-test="n-input"]')
    await inputs[2].setValue('password-1')
    await inputs[3].setValue('password-2')

    await findButtonByText(wrapper, 'auth.action.changePassword').trigger('click')

    expect(messageErrorSpy).toHaveBeenCalledWith('auth.validation.passwordMismatch')
    expect(recoveryMutateSpy).not.toHaveBeenCalled()
  })

  it('submits password recovery payload with trim and sms bizId', async () => {
    const wrapper = mount(PasswordRecoveryView)

    const inputs = wrapper.findAll('input[data-test="n-input"]')
    await inputs[0].setValue(' 13800138000 ')
    await inputs[1].setValue(' 123456 ')
    await inputs[2].setValue('new-password')
    await inputs[3].setValue('new-password')

    await findButtonByText(wrapper, 'auth.action.changePassword').trigger('click')

    expect(convertSpy).toHaveBeenCalledWith({
      phone: '13800138000',
      password: 'new-password',
      dbCheckPassword: 'new-password',
      code: '123456',
      bizId: 'biz-2',
    })
    expect(recoveryMutateSpy).toHaveBeenCalledWith({
      phone: '13800138000',
      password: 'new-password',
      dbCheckPassword: 'new-password',
      code: '123456',
      bizId: 'biz-2',
      mapped: true,
    })
  })
})
