import { defineComponent, h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type AdditionalInfoStatus = {
  id: number
  status: string
} | null

type LoadedProfileData = {
  profile: {
    name: string
  }
}

const {
  routerPushSpy,
  routerReplaceSpy,
  accountState,
  statusQueryState,
  loadUserInfoState,
  reqMutateSpy,
  reqPendingState,
  reqCallbackRef,
  convertSpy,
  formValidationErrorsRef,
  formValuesRef,
  formRefExpose,
} = vi.hoisted(() => ({
  routerPushSpy: vi.fn(),
  routerReplaceSpy: vi.fn(),
  accountState: {
    token: 'token-1',
    profile: {
      name: 'profile-name',
    },
  },
  statusQueryState: {
    data: {
      value: null as AdditionalInfoStatus,
    },
  },
  loadUserInfoState: {
    data: {
      value: {
        profile: {
          name: 'loaded-profile',
        },
      } as LoadedProfileData,
    },
    isLoading: {
      value: false,
    },
    refetch: vi.fn(),
  },
  reqMutateSpy: vi.fn(),
  reqPendingState: {
    value: false,
  },
  reqCallbackRef: {
    value: undefined as ((data: { id: number }) => void) | undefined,
  },
  convertSpy: vi.fn(),
  formValidationErrorsRef: {
    value: null as unknown,
  },
  formValuesRef: {
    value: {
      name: 'alice',
      identity: 'id-1',
    },
  },
  formRefExpose: {
    getFormInstance: vi.fn(() => ({
      validate: (cb: (errors: unknown) => void) => cb(formValidationErrorsRef.value),
      values: formValuesRef.value,
    })),
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: routerPushSpy,
    replace: routerReplaceSpy,
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/modules/user/application/stores/useAccountStore', () => ({
  useAccountStore: () => accountState,
}))

vi.mock('@/modules/approval/application/hooks/useApprovalService', () => ({
  useLatestAdditionalInfoInstanceStatus: () => statusQueryState,
}))

vi.mock('@/modules/user/application/hooks/useLoadUserInfo', () => ({
  useLoadUserInfo: vi.fn(() => loadUserInfoState),
}))

vi.mock('@/modules/user/application/hooks/useUserAdditionalInfoRequest', () => ({
  useUserAdditionalInfoRequest: vi.fn((callback?: (data: { id: number }) => void) => {
    reqCallbackRef.value = callback
    return {
      mutate: reqMutateSpy,
      isPending: reqPendingState,
    }
  }),
}))

vi.mock('@/modules/user/application/ui-mappers', () => ({
  convertUIToUserAdditionalInfoForm: convertSpy,
}))

vi.mock('@/modules/user/presentation/user_additional_info/UserAdditionalInfoForm', () => ({
  default: defineComponent({
    name: 'UserAdditionalInfoUiForm',
    props: {
      initialValue: {
        required: false,
      },
      type: {
        type: String,
        required: false,
      },
    },
    setup(props, { expose }) {
      expose(formRefExpose)
      return () =>
        h('section', {
          'data-test': 'user-additional-form',
          'data-type': props.type,
          'data-has-initial': String(Boolean(props.initialValue)),
        })
    },
  }),
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
  NSkeleton: defineComponent({
    name: 'NSkeleton',
    setup() {
      return () => h('div', { 'data-test': 'n-skeleton' })
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    props: {
      onClick: {
        type: Function,
        required: false,
      },
      disabled: {
        type: Boolean,
        required: false,
      },
      loading: {
        type: Boolean,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'button',
          {
            onClick: props.onClick,
            disabled: props.disabled,
            'data-loading': String(Boolean(props.loading)),
          },
          slots.default?.(),
        )
    },
  }),
}))

import UserAdditionalInfoView from '@/views/auth/UserAdditionalInfoView.vue'

const findButtonByText = (wrapper: VueWrapper, text: string) => {
  const button = wrapper.findAll('button').find((item) => item.text() === text)
  if (!button) {
    throw new Error(`button not found: ${text}`)
  }
  return button
}

describe('UserAdditionalInfoView', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    statusQueryState.data.value = {
      id: 10,
      status: 'approved',
    }
    loadUserInfoState.isLoading.value = false
    loadUserInfoState.data.value = {
      profile: {
        name: 'loaded-profile',
      },
    }

    reqPendingState.value = false
    formValidationErrorsRef.value = null
    formValuesRef.value = {
      name: 'alice',
      identity: 'id-1',
    }
    convertSpy.mockReturnValue({ submit: 'payload' })
    reqCallbackRef.value = undefined
  })

  it('redirects to pending page immediately when status is approving', () => {
    statusQueryState.data.value = {
      id: 20,
      status: 'pending',
    }

    mount(UserAdditionalInfoView)

    expect(routerReplaceSpy).toHaveBeenCalledWith({
      name: 'user-additional-info-pending',
      query: {
        instanceId: 20,
      },
    })
  })

  it('renders loading skeleton when pageStatus is loading', () => {
    statusQueryState.data.value = null

    const wrapper = mount(UserAdditionalInfoView)

    expect(wrapper.find('[data-test="n-skeleton"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="user-additional-form"]').exists()).toBe(false)
  })

  it('renders editable form when pageStatus is visible', () => {
    const wrapper = mount(UserAdditionalInfoView)

    const form = wrapper.get('[data-test="user-additional-form"]')
    expect(form.attributes('data-type')).toBe('edit')
    expect(form.attributes('data-has-initial')).toBe('true')
  })

  it('submits converted payload when save is clicked and validation passes', async () => {
    const wrapper = mount(UserAdditionalInfoView)

    const saveBtn = findButtonByText(wrapper, 'common.action.save')
    await saveBtn.trigger('click')

    expect(convertSpy).toHaveBeenCalledWith(formValuesRef.value)
    expect(reqMutateSpy).toHaveBeenCalledWith({ submit: 'payload' })
  })

  it('skips submit when validation has errors', async () => {
    formValidationErrorsRef.value = [[{ field: 'name' }]]

    const wrapper = mount(UserAdditionalInfoView)

    const saveBtn = findButtonByText(wrapper, 'common.action.save')
    await saveBtn.trigger('click')

    expect(convertSpy).not.toHaveBeenCalled()
    expect(reqMutateSpy).not.toHaveBeenCalled()
  })

  it('navigates back to profile when back button is clicked', async () => {
    const wrapper = mount(UserAdditionalInfoView)

    const backBtn = findButtonByText(wrapper, 'common.action.back')
    await backBtn.trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith({ name: 'user-profile' })
  })

  it('handles request success callback by refetching and jumping pending page', () => {
    mount(UserAdditionalInfoView)

    reqCallbackRef.value?.({ id: 66 })

    expect(loadUserInfoState.refetch).toHaveBeenCalledTimes(1)
    expect(routerPushSpy).toHaveBeenCalledWith({
      name: 'user-additional-info-pending',
      query: {
        instanceId: 66,
      },
    })
  })
})
