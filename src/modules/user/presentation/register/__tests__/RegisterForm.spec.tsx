import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

const { mutateSpy, validateErrorsState } = vi.hoisted(() => ({
  mutateSpy: vi.fn(),
  validateErrorsState: {
    value: null as unknown,
  },
}))

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('@/modules/captcha/application/hooks/useSMS', () => ({
  useSMS: () => ({
    getSendBtnLabelText: () => ({ value: 'send-now' }),
    getSMSCoolDownSecond: () => ({ value: 0 }),
    sendSMSCode: () => ({
      mutate: mutateSpy,
      isPending: { value: false },
      data: { value: { bizId: 'biz-1' } },
    }),
  }),
}))

vi.mock('@/modules/access/application/validation', () => ({
  registerFormValidation: vi.fn(() => ({ rules: {} })),
}))

vi.mock('vue-router', () => ({
  RouterLink: defineComponent({
    name: 'RouterLink',
    setup(_, { slots }) {
      return () => h('a', { 'data-test': 'router-link' }, slots.default?.())
    },
  }),
}))

vi.mock('lucide-vue-next', () => ({
  Info: defineComponent({
    name: 'Info',
    setup() {
      return () => h('span')
    },
  }),
  IdCard: defineComponent({
    name: 'IdCard',
    setup() {
      return () => h('span')
    },
  }),
  KeyRound: defineComponent({
    name: 'KeyRound',
    setup() {
      return () => h('span')
    },
  }),
  Mail: defineComponent({
    name: 'Mail',
    setup() {
      return () => h('span')
    },
  }),
  Send: defineComponent({
    name: 'Send',
    setup() {
      return () => h('span')
    },
  }),
}))

vi.mock('naive-ui', () => ({
  NForm: defineComponent({
    name: 'NForm',
    setup(_, { slots, expose }) {
      expose({
        validate: (callback: (errors: unknown) => void) => {
          callback(validateErrorsState.value)
        },
      })
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
    setup() {
      return () => h('input', { 'data-test': 'n-input' })
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    emits: ['click'],
    setup(_, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            'data-test': 'n-button',
            onClick: () => emit('click'),
          },
          slots.default?.(),
        )
    },
  }),
  NTooltip: defineComponent({
    name: 'NTooltip',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-tooltip' }, [slots.trigger?.(), slots.default?.()])
    },
  }),
  NIcon: defineComponent({
    name: 'NIcon',
    setup(_, { slots }) {
      return () => h('i', { 'data-test': 'n-icon' }, slots.default?.())
    },
  }),
}))

import RegisterForm from '@/modules/user/presentation/register/RegisterForm'

const initialValues = {
  phone: '13800138000',
  password: 'new-password',
  dbCheckPassword: 'new-password',
  code: '123456',
  captchaKey: 'captcha-key',
  captcha: 'abcd',
  bizId: 'biz-old',
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    validateErrorsState.value = null
  })

  it('sends sms code with current phone when send button is clicked', async () => {
    const wrapper = mount(RegisterForm, {
      props: {
        initialValues,
      },
    })

    const sendBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('send-now'))
    expect(sendBtn).toBeTruthy()

    await sendBtn!.trigger('click')
    expect(mutateSpy).toHaveBeenCalledWith('13800138000')
  })

  it('emits submit payload with bizId when form validates', async () => {
    const wrapper = mount(RegisterForm, {
      props: {
        initialValues,
      },
    })

    const submitBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('auth.register.submit'))
    expect(submitBtn).toBeTruthy()

    await submitBtn!.trigger('click')

    const emitted = wrapper.emitted('submit') || []
    expect(emitted.length).toBe(1)
    expect(emitted[0][0]).toEqual({
      ...initialValues,
      bizId: 'biz-1',
    })
  })

  it('does not emit submit when validation returns errors', async () => {
    validateErrorsState.value = [[{ field: 'phone' }]]

    const wrapper = mount(RegisterForm, {
      props: {
        initialValues,
      },
    })

    const submitBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('auth.register.submit'))

    await submitBtn!.trigger('click')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})
