import { defineComponent, h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type ApprovalStatusLike = 'pending' | 'handling' | 'approved' | 'rejected' | 'canceled'

type LatestAdditionalInfoStatusLike = {
  id: number | null
  status: ApprovalStatusLike
} | null

type UserBaseInfoLike = {
  name: string
  phone: string
  platform: 'WECHAT' | 'GITHUB' | 'NATIVE'
}

type UserProfileInfoLike = {
  companyName: string
}

type LoadUserInfoDataLike = {
  user: UserBaseInfoLike
  profile: UserProfileInfoLike | null
}

type ServiceAgreementPageLike = {
  total: number
}

const {
  routerPushSpy,
  accountState,
  tabsStoreState,
  statusQueryState,
  loadUserInfoState,
  recordPageState,
  signPageState,
  messageInfoSpy,
} = vi.hoisted(() => ({
  routerPushSpy: vi.fn(),
  accountState: {
    token: 'token-1',
    profile: {
      companyName: 'profile-company',
    },
    user: {
      name: 'AccountUser',
      phone: '13800138000',
      platform: 'NATIVE',
    },
    logout: vi.fn(),
  },
  tabsStoreState: {
    clearTabs: vi.fn(),
  },
  statusQueryState: {
    data: {
      value: null as LatestAdditionalInfoStatusLike,
    },
  },
  loadUserInfoState: {
    data: {
      value: {
        user: {
          name: 'LoadedUser',
          phone: '13900000000',
          platform: 'WECHAT',
        },
        profile: {
          companyName: 'loaded-company',
        },
      } as LoadUserInfoDataLike,
    },
    isLoading: {
      value: false,
    },
  },
  recordPageState: {
    data: {
      value: {
        total: 2,
      } as ServiceAgreementPageLike,
    },
  },
  signPageState: {
    data: {
      value: {
        total: 3,
      } as ServiceAgreementPageLike,
    },
  },
  messageInfoSpy: vi.fn(),
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
  createI18n: () => ({
    global: {
      t: (key: string) => key,
    },
  }),
}))

vi.mock('@/modules/user/application/stores/useAccountStore', () => ({
  useAccountStore: () => accountState,
}))

vi.mock('@/app/application/stores/useTabsStore', () => ({
  useTabsStore: () => tabsStoreState,
}))

vi.mock('@/modules/approval/application/hooks/useApprovalService', () => ({
  useLatestAdditionalInfoInstanceStatus: () => statusQueryState,
}))

vi.mock('@/modules/user/application/hooks/useLoadUserInfo', () => ({
  useLoadUserInfo: vi.fn(() => loadUserInfoState),
}))

vi.mock('@/modules/service-agreement/application/hooks/useSignService', () => ({
  useServiceAgreementPage: vi.fn((requestRef) => {
    const statusValue = requestRef?.value?.query?.status?.value
    if (statusValue === 1) {
      return recordPageState
    }
    return signPageState
  }),
}))

vi.mock('@/modules/user/application/utils/platform', () => ({
  resolvePlatformLabelKey: vi.fn(() => 'platform.wechat'),
}))

vi.mock('@/_utils/discrete_naive_api', () => ({
  message: {
    info: messageInfoSpy,
  },
}))

vi.mock('@/modules/user/presentation/user_additional_info/UserAdditionalInfoForm', () => ({
  default: defineComponent({
    name: 'UserAdditionalInfoUiForm',
    props: {
      type: {
        type: String,
        required: false,
      },
      initialValue: {
        required: false,
      },
    },
    setup(props) {
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
  NSkeleton: defineComponent({
    name: 'NSkeleton',
    setup() {
      return () => h('div', { 'data-test': 'n-skeleton' })
    },
  }),
  NCard: defineComponent({
    name: 'NCard',
    setup(_, { slots }) {
      return () =>
        h('section', { 'data-test': 'n-card' }, [slots.default?.(), slots['header-extra']?.()])
    },
  }),
  NGrid: defineComponent({
    name: 'NGrid',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-grid' }, slots.default?.())
    },
  }),
  NGridItem: defineComponent({
    name: 'NGridItem',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-grid-item' }, slots.default?.())
    },
  }),
  NAvatar: defineComponent({
    name: 'NAvatar',
    props: {
      onClick: {
        type: Function,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('button', { 'data-test': 'n-avatar', onClick: props.onClick }, slots.default?.())
    },
  }),
  NStatistic: defineComponent({
    name: 'NStatistic',
    props: {
      label: {
        type: String,
        required: false,
      },
      value: {
        required: false,
      },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-test': 'n-statistic',
          'data-label': props.label,
          'data-value': String(props.value),
        })
    },
  }),
  NResult: defineComponent({
    name: 'NResult',
    props: {
      status: {
        type: String,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('section', { 'data-test': 'n-result', 'data-status': props.status }, slots.footer?.())
    },
  }),
  NButton: defineComponent({
    name: 'NButton',
    props: {
      onClick: {
        type: Function,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () => h('button', { onClick: props.onClick }, slots.default?.())
    },
  }),
}))

vi.mock('@vicons/ionicons5', () => ({
  CameraOutline: defineComponent({
    name: 'CameraOutline',
    setup() {
      return () => h('i', { 'data-test': 'camera-icon' })
    },
  }),
  LogOutOutline: defineComponent({
    name: 'LogOutOutline',
    setup() {
      return () => h('i', { 'data-test': 'logout-icon' })
    },
  }),
}))

import UserProfileView from '@/views/auth/UserProfileView.vue'

const findButtonByText = (wrapper: VueWrapper, text: string) => {
  const button = wrapper.findAll('button').find((item) => item.text() === text)
  if (!button) {
    throw new Error(`button not found: ${text}`)
  }
  return button
}

describe('UserProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    statusQueryState.data.value = {
      id: 10,
      status: 'approved',
    }

    loadUserInfoState.isLoading.value = false
    loadUserInfoState.data.value = {
      user: {
        name: 'LoadedUser',
        phone: '13900000000',
        platform: 'WECHAT',
      },
      profile: {
        companyName: 'loaded-company',
      },
    }

    recordPageState.data.value = {
      total: 2,
    }
    signPageState.data.value = {
      total: 3,
    }
  })

  it('renders loading skeleton when profile page status is loading', () => {
    statusQueryState.data.value = null

    const wrapper = mount(UserProfileView)

    expect(wrapper.find('[data-test="n-skeleton"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="n-result"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="user-additional-form"]').exists()).toBe(false)
  })

  it('renders approval result when page status is approving', () => {
    statusQueryState.data.value = {
      id: 99,
      status: 'pending',
    }

    const wrapper = mount(UserProfileView)

    expect(wrapper.find('[data-test="n-result"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="n-result"]').attributes('data-status')).toBe('info')
  })

  it('jumps to approval detail when instance id exists', async () => {
    statusQueryState.data.value = {
      id: 88,
      status: 'pending',
    }

    const wrapper = mount(UserProfileView)

    const viewApprovalBtn = findButtonByText(wrapper, 'domain.user.approval.btn')
    await viewApprovalBtn.trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith({
      name: 'approval-instance-detail',
      query: {
        template: '用户信息审批',
        instanceId: 88,
      },
    })
  })

  it('falls back to approval list when instance id is unavailable', async () => {
    statusQueryState.data.value = {
      id: null,
      status: 'pending',
    }

    const wrapper = mount(UserProfileView)

    const viewApprovalBtn = findButtonByText(wrapper, 'domain.user.approval.btn')
    await viewApprovalBtn.trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith({ name: 'approval-my-approval-instance-page' })
  })

  it('renders detail form and supports edit navigation in visible status', async () => {
    const wrapper = mount(UserProfileView)

    const form = wrapper.get('[data-test="user-additional-form"]')
    expect(form.attributes('data-type')).toBe('detail')

    const editBtn = findButtonByText(wrapper, 'common.action.edit')
    await editBtn.trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith({ name: 'user-additional-info' })
  })

  it('shows avatar upload tip on avatar and camera button clicks', async () => {
    const wrapper = mount(UserProfileView)

    await wrapper.get('[data-test="n-avatar"]').trigger('click')
    await wrapper.get('[title="layout.profile.avatar.upload"]').trigger('click')

    expect(messageInfoSpy).toHaveBeenCalledTimes(2)
    expect(messageInfoSpy).toHaveBeenNthCalledWith(1, 'layout.profile.avatar.uploadTodo')
    expect(messageInfoSpy).toHaveBeenNthCalledWith(2, 'layout.profile.avatar.uploadTodo')
  })

  it('logs out and clears tabs before routing to login', async () => {
    const wrapper = mount(UserProfileView)

    const logoutBtn = findButtonByText(wrapper, 'auth.action.logout')
    await logoutBtn.trigger('click')

    expect(accountState.logout).toHaveBeenCalledTimes(1)
    expect(tabsStoreState.clearTabs).toHaveBeenCalledTimes(1)
    expect(routerPushSpy).toHaveBeenCalledWith({ name: 'login' })
  })
})
