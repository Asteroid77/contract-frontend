import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

const { validateErrorsState, captchaRefetchSpy } = vi.hoisted(() => ({
  validateErrorsState: {
    value: null as unknown,
  },
  captchaRefetchSpy: vi.fn(),
}))

vi.mock('@/_utils/i18n', () => ({
  $t: vi.fn((key: string) => key),
}))

vi.mock('@/modules/captcha/application/hooks/useCaptcha', () => ({
  useCaptcha: () => ({
    isLoading: { value: false },
    data: {
      value: {
        id: 'captcha-id-1',
        image: 'data:image/png;base64,abc',
      },
    },
    refetch: captchaRefetchSpy,
  }),
}))

vi.mock('@/modules/access/application/validation', () => ({
  loginFormValidation: vi.fn(() => ({ rules: {} })),
}))

vi.mock('@/modules/user/application/ui-mappers', () => ({
  createSignInModel: vi.fn((initialValues) => ({ ...(initialValues || {}) })),
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
  NDivider: defineComponent({
    name: 'NDivider',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-divider' }, slots.default?.())
    },
  }),
  NImage: defineComponent({
    name: 'NImage',
    props: {
      src: {
        type: String,
        required: false,
      },
    },
    setup(props) {
      return () => h('img', { 'data-test': 'n-image', 'data-src': props.src ?? '' })
    },
  }),
  NSpin: defineComponent({
    name: 'NSpin',
    setup() {
      return () => h('div', { 'data-test': 'n-spin' })
    },
  }),
  NSpace: defineComponent({
    name: 'NSpace',
    emits: ['click'],
    setup(_, { emit, slots }) {
      return () =>
        h(
          'div',
          {
            'data-test': 'n-space',
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

import LoginForm from '@/modules/user/presentation/login/LoginForm'

const initialValues = {
  phone: '13800138000',
  password: 'password',
  captcha: '1234',
  captchaKey: 'old-captcha-key',
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    validateErrorsState.value = null
  })

  it('triggers captcha refetch when captcha area is clicked', async () => {
    const wrapper = mount(LoginForm, {
      props: {
        initialValues,
      },
    })

    await wrapper.get('[data-test="n-space"]').trigger('click')
    expect(captchaRefetchSpy).toHaveBeenCalledTimes(1)
  })

  it('emits submit payload with latest captchaKey when validation passes', async () => {
    const wrapper = mount(LoginForm, {
      props: {
        initialValues,
      },
    })

    const submitBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('auth.login.title'))

    expect(submitBtn).toBeTruthy()
    await submitBtn!.trigger('click')

    const emitted = wrapper.emitted('submit') || []
    expect(emitted.length).toBe(1)
    expect(emitted[0][0]).toEqual({
      ...initialValues,
      captchaKey: 'captcha-id-1',
    })
  })

  it('does not emit submit when validation has errors', async () => {
    validateErrorsState.value = [[{ field: 'phone' }]]

    const wrapper = mount(LoginForm, {
      props: {
        initialValues,
      },
    })

    const submitBtn = wrapper
      .findAll('[data-test="n-button"]')
      .find((node) => node.text().includes('auth.login.title'))

    await submitBtn!.trigger('click')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})
