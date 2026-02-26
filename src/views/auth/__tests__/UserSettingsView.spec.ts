import { defineComponent, h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  setThemeSpy,
  setLanguageSpy,
  languageRef,
  currentThemeRef,
  routerReplaceSpy,
  accountLogoutSpy,
  messageSuccessSpy,
  messageErrorSpy,
  messageInfoSpy,
  messageWarningSpy,
  dialogWarningSpy,
  changePasswordMutateAsyncSpy,
  changePasswordPendingRef,
  userDevicesDataRef,
  userDevicesLoadingRef,
  userDevicesFetchingRef,
  userDevicesRefetchSpy,
  revokeDevicesMutateAsyncSpy,
  revokeDevicesPendingRef,
} = vi.hoisted(() => ({
  setThemeSpy: vi.fn(),
  setLanguageSpy: vi.fn(),
  languageRef: { value: 'zh-CN' as 'zh-CN' | 'en' },
  currentThemeRef: { value: 'light' as 'light' | 'dark' | 'sakura' },
  routerReplaceSpy: vi.fn(),
  accountLogoutSpy: vi.fn(),
  messageSuccessSpy: vi.fn(),
  messageErrorSpy: vi.fn(),
  messageInfoSpy: vi.fn(),
  messageWarningSpy: vi.fn(),
  dialogWarningSpy: vi.fn(),
  changePasswordMutateAsyncSpy: vi.fn(),
  changePasswordPendingRef: { value: false },
  userDevicesDataRef: {
    value: [
      {
        deviceId: 'dev-1',
        clientIp: '127.0.0.1',
        userAgent: 'UA',
        lastActiveAt: '2026-02-10T00:00:00Z',
        currentDevice: true,
      },
    ],
  },
  userDevicesLoadingRef: { value: false },
  userDevicesFetchingRef: { value: false },
  userDevicesRefetchSpy: vi.fn(),
  revokeDevicesMutateAsyncSpy: vi.fn(),
  revokeDevicesPendingRef: { value: false },
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    replace: routerReplaceSpy,
  }),
}))

vi.mock('@/app/presentation/theme/hooks/useTheme', () => ({
  useTheme: () => ({
    currentTheme: currentThemeRef,
    setTheme: setThemeSpy,
  }),
}))

vi.mock('@/_utils/i18n', () => ({
  language: languageRef,
  setLanguage: setLanguageSpy,
}))

vi.mock('@/modules/user/application/hooks/useChangePassword', () => ({
  useChangePassword: () => ({
    mutateAsync: changePasswordMutateAsyncSpy,
    isPending: changePasswordPendingRef,
  }),
}))

vi.mock('@/modules/user/application/stores/useAccountStore', () => ({
  useAccountStore: () => ({
    logout: accountLogoutSpy,
    user: {
      name: 'Tester',
    },
  }),
}))

vi.mock('@/modules/user/application/hooks/useUserDevices', () => ({
  useCurrentUserDevicesQuery: () => ({
    data: userDevicesDataRef,
    isLoading: userDevicesLoadingRef,
    isFetching: userDevicesFetchingRef,
    refetch: userDevicesRefetchSpy,
  }),
  useRevokeCurrentUserDevicesMutation: () => ({
    mutateAsync: revokeDevicesMutateAsyncSpy,
    isPending: revokeDevicesPendingRef,
  }),
}))

vi.mock('@/modules/shared/presentation/time', () => ({
  formatted: vi.fn(() => ({ standard: '2026-02-10 08:00:00' })),
}))

vi.mock('@/_utils/discrete_naive_api', () => ({
  message: {
    success: messageSuccessSpy,
    error: messageErrorSpy,
    info: messageInfoSpy,
    warning: messageWarningSpy,
  },
  dialog: {
    warning: dialogWarningSpy,
  },
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
  NDivider: defineComponent({
    name: 'NDivider',
    setup() {
      return () => h('hr', { 'data-test': 'n-divider' })
    },
  }),
  NSelect: defineComponent({
    name: 'NSelect',
    props: {
      value: {
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-test': 'n-select',
          onClick: () => {
            const current = String(props.value ?? '')
            emit('update:value', current.includes('-') ? 'en' : 'dark')
          },
        })
    },
  }),
  NSwitch: defineComponent({
    name: 'NSwitch',
    props: {
      value: {
        type: Boolean,
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          'data-test': 'n-switch',
          onClick: () => emit('update:value', !props.value),
        })
    },
  }),
  NForm: defineComponent({
    name: 'NForm',
    setup(_, { slots, expose }) {
      expose({
        validate: () => Promise.resolve(),
        restoreValidation: vi.fn(),
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
    props: {
      value: {
        type: String,
        required: false,
      },
    },
    emits: ['update:value'],
    setup(props) {
      return () => h('input', { value: props.value })
    },
  }),
  NDataTable: defineComponent({
    name: 'NDataTable',
    emits: ['update:checked-row-keys'],
    setup(_, { emit }) {
      return () =>
        h('div', { 'data-test': 'n-data-table' }, [
          h('button', {
            'data-test': 'select-device',
            onClick: () => emit('update:checked-row-keys', ['dev-1']),
          }),
        ])
    },
  }),
  NTag: defineComponent({
    name: 'NTag',
    setup(_, { slots }) {
      return () => h('span', { 'data-test': 'n-tag' }, slots.default?.())
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
            onClick: props.onClick,
          },
          slots.default?.(),
        )
    },
  }),
}))

import UserSettingsView from '@/views/auth/UserSettingsView.vue'

const TotpSettingsSectionStub = defineComponent({
  name: 'TotpSettingsSection',
  setup() {
    return () =>
      h(
        'button',
        {
          onClick: () => messageInfoSpy('layout.profile.twoFactor.todo'),
        },
        'layout.profile.twoFactor.action',
      )
  },
})

const mountView = () =>
  mount(UserSettingsView, {
    global: {
      stubs: {
        TotpSettingsSection: TotpSettingsSectionStub,
      },
    },
  })

const findButtonByText = (wrapper: VueWrapper, text: string) => {
  const button = wrapper.findAll('button').find((item) => item.text() === text)
  if (!button) {
    throw new Error(`button not found: ${text}`)
  }
  return button
}

describe('UserSettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    languageRef.value = 'zh-CN'
    currentThemeRef.value = 'light'

    changePasswordPendingRef.value = false
    revokeDevicesPendingRef.value = false

    changePasswordMutateAsyncSpy.mockResolvedValue(true)
    revokeDevicesMutateAsyncSpy.mockResolvedValue({
      revokedCount: 1,
      skippedCurrentDeviceCount: 1,
    })

    userDevicesDataRef.value = [
      {
        deviceId: 'dev-1',
        clientIp: '127.0.0.1',
        userAgent: 'UA',
        lastActiveAt: '2026-02-10T00:00:00Z',
        currentDevice: true,
      },
    ]
  })

  it('handles theme and language changes via select components', async () => {
    const wrapper = mountView()

    const selects = wrapper.findAll('[data-test="n-select"]')
    await selects[0].trigger('click')
    await selects[1].trigger('click')

    expect(setThemeSpy).toHaveBeenCalledWith('dark')
    expect(setLanguageSpy).toHaveBeenCalledWith('en')
  })

  it('submits change password success path and redirects to login', async () => {
    const wrapper = mountView()

    const submitBtn = findButtonByText(wrapper, 'layout.profile.security.changePassword.action')
    await submitBtn.trigger('click')

    expect(changePasswordMutateAsyncSpy).toHaveBeenCalledWith({
      oldPassword: '',
      newPassword: '',
    })
    expect(messageSuccessSpy).toHaveBeenCalledWith('layout.profile.security.changePassword.success')
    expect(accountLogoutSpy).toHaveBeenCalledTimes(1)
    expect(routerReplaceSpy).toHaveBeenCalledWith({ name: 'login' })
  })

  it('shows error message when change password returns false', async () => {
    changePasswordMutateAsyncSpy.mockResolvedValue(false)

    const wrapper = mountView()

    const submitBtn = findButtonByText(wrapper, 'layout.profile.security.changePassword.action')
    await submitBtn.trigger('click')

    expect(messageErrorSpy).toHaveBeenCalledWith('common.status.error')
    expect(accountLogoutSpy).not.toHaveBeenCalled()
    expect(routerReplaceSpy).not.toHaveBeenCalled()
  })

  it('refreshes device list via refresh action', async () => {
    const wrapper = mountView()

    const refreshBtn = findButtonByText(wrapper, 'layout.profile.security.devices.refreshAction')
    await refreshBtn.trigger('click')

    expect(userDevicesRefetchSpy).toHaveBeenCalledTimes(1)
  })

  it('warns when revoking without selected devices', async () => {
    const wrapper = mountView()

    const revokeBtn = findButtonByText(wrapper, 'layout.profile.security.devices.revokeAction')
    await revokeBtn.trigger('click')

    expect(messageWarningSpy).toHaveBeenCalledWith('common.validation.selectAtLeast')
    expect(dialogWarningSpy).not.toHaveBeenCalled()
  })

  it('revokes selected devices after dialog confirmation', async () => {
    const wrapper = mountView()

    await wrapper.get('[data-test="select-device"]').trigger('click')

    const revokeBtn = findButtonByText(wrapper, 'layout.profile.security.devices.revokeAction')
    await revokeBtn.trigger('click')

    expect(dialogWarningSpy).toHaveBeenCalledTimes(1)

    const dialogConfig = dialogWarningSpy.mock.calls[0][0] as {
      onPositiveClick: () => Promise<void>
    }
    await dialogConfig.onPositiveClick()

    expect(revokeDevicesMutateAsyncSpy).toHaveBeenCalledWith({
      deviceIds: ['dev-1'],
      allowCurrentDevice: false,
    })
    expect(messageSuccessSpy).toHaveBeenCalledWith('layout.profile.security.devices.revokeSuccess')
    expect(messageWarningSpy).toHaveBeenCalledWith(
      'layout.profile.security.devices.revokeSkippedCurrentDevice',
    )
  })

  it('handles 2FA and dangerous delete actions', async () => {
    const wrapper = mountView()

    const twoFaBtn = findButtonByText(wrapper, 'layout.profile.twoFactor.action')
    await twoFaBtn.trigger('click')
    expect(messageInfoSpy).toHaveBeenCalledWith('layout.profile.twoFactor.todo')

    const dangerBtn = findButtonByText(wrapper, 'layout.profile.danger.action')
    await dangerBtn.trigger('click')

    expect(dialogWarningSpy).toHaveBeenCalledTimes(1)

    const dialogConfig = dialogWarningSpy.mock.calls[0][0] as {
      onPositiveClick: () => void
    }
    dialogConfig.onPositiveClick()

    expect(messageWarningSpy).toHaveBeenCalledWith('layout.profile.danger.todo')
  })
})
