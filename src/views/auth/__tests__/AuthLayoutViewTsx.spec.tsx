import { defineComponent, h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

type DropdownOption = {
  key: string
  label?: string
}

const {
  routeState,
  routerPushSpy,
  setLanguageSpy,
  setThemeSpy,
  addTabSpy,
  removeTabSpy,
  clearTabsSpy,
  setActiveTabSpy,
  accountLogoutSpy,
  languageRef,
  currentThemeRef,
  tabsStoreState,
} = vi.hoisted(() => ({
  routeState: {
    name: 'dashboard',
    path: '/dashboard',
    fullPath: '/dashboard',
    meta: {
      name: 'crumb.current',
    } as Record<string, unknown>,
  },
  routerPushSpy: vi.fn(),
  setLanguageSpy: vi.fn(),
  setThemeSpy: vi.fn(),
  addTabSpy: vi.fn(),
  removeTabSpy: vi.fn(() => '/after-close'),
  clearTabsSpy: vi.fn(),
  setActiveTabSpy: vi.fn(),
  accountLogoutSpy: vi.fn(),
  languageRef: {
    value: 'zh-CN' as 'zh-CN' | 'en',
  },
  currentThemeRef: {
    value: 'light' as 'light' | 'dark' | 'sakura',
  },
  tabsStoreState: {
    tabList: [
      { path: '/dashboard', titleKey: 'tab.first' },
      { path: '/reports', titleKey: 'tab.second' },
    ] as Array<{ path: string; titleKey: string; titleSuffix?: string }>,
    activeTab: '/dashboard',
    addTab: vi.fn(),
    removeTab: vi.fn(),
    clearTabs: vi.fn(),
    setActiveTab: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push: routerPushSpy,
  }),
  RouterView: defineComponent({
    name: 'RouterView',
    setup(_, { slots }) {
      const SlotComponent = defineComponent({
        name: 'AuthLayoutChildPage',
        setup() {
          return () => h('section', { 'data-test': 'router-slot-page' }, 'child-page')
        },
      })

      return () =>
        h('div', { 'data-test': 'router-view' }, slots.default?.({ Component: SlotComponent }))
    },
  }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/_utils/i18n', () => ({
  language: languageRef,
  setLanguage: setLanguageSpy,
}))

vi.mock('@/app/presentation/theme/hooks/useTheme', () => ({
  useTheme: () => ({
    currentTheme: currentThemeRef,
    setTheme: setThemeSpy,
  }),
}))

vi.mock('@/app/application/stores/useTabsStore', () => ({
  useTabsStore: () => tabsStoreState,
}))

vi.mock('@/modules/user/application/stores/useAccountStore', () => ({
  useAccountStore: () => ({
    user: {
      name: 'Tester',
      phone: '13800138000',
      platform: 'WEB',
    },
    logout: accountLogoutSpy,
  }),
}))

vi.mock('@/modules/user/application/utils/platform', () => ({
  resolvePlatformLabelKey: () => 'platform.web',
}))

vi.mock('@/router/modules', () => ({
  dashboardRoutes: [
    {
      name: 'dashboard',
      path: '/dashboard',
      meta: {
        name: 'menu.entry',
        icon: 'icon-dashboard',
      },
    },
  ],
  businessRoutes: [
    {
      name: 'hidden-route',
      path: '/hidden',
      meta: {
        name: 'menu.hidden',
        hideInMenu: true,
      },
    },
  ],
  userRoutes: [],
  manageRoutes: [],
  approvalRoutes: [],
}))

vi.mock('@/app/presentation/layout/utils/BreadCrumbBuilder', () => ({
  findAllParents: () => [],
}))

vi.mock('@/app/presentation/layout/utils/MenuBuilder', () => ({
  resolveIcon: () =>
    defineComponent({
      name: 'ResolvedMenuIcon',
      setup() {
        return () => h('i', { 'data-test': 'resolved-menu-icon' })
      },
    }),
}))

vi.mock('@/_utils/widget/renderIcon', () => ({
  renderIcon: () =>
    defineComponent({
      name: 'RenderIconFallback',
      setup() {
        return () => h('i', { 'data-test': 'render-icon-fallback' })
      },
    }),
}))

vi.mock('@/app/observability/components/ErrorBoundary', () => ({
  default: defineComponent({
    name: 'ErrorBoundary',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'error-boundary' }, slots.default?.())
    },
  }),
}))

vi.mock('@/assets/logo.svg?url', () => ({
  default: 'logo-mock-url',
}))

vi.mock('@vicons/ionicons5', () => ({
  ChevronBackOutline: defineComponent({
    name: 'ChevronBackOutline',
    setup() {
      return () => h('i', { 'data-test': 'icon-chevron-back' })
    },
  }),
  ChevronForwardOutline: defineComponent({
    name: 'ChevronForwardOutline',
    setup() {
      return () => h('i', { 'data-test': 'icon-chevron-forward' })
    },
  }),
  CloseOutline: defineComponent({
    name: 'CloseOutline',
    setup() {
      return () => h('i', { 'data-test': 'icon-close' })
    },
  }),
  LogOutOutline: defineComponent({
    name: 'LogOutOutline',
    setup() {
      return () => h('i', { 'data-test': 'icon-logout' })
    },
  }),
  MenuOutline: defineComponent({
    name: 'MenuOutline',
    setup() {
      return () => h('i', { 'data-test': 'icon-menu' })
    },
  }),
  SettingsOutline: defineComponent({
    name: 'SettingsOutline',
    setup() {
      return () => h('i', { 'data-test': 'icon-settings' })
    },
  }),
  MoonOutline: defineComponent({
    name: 'MoonOutline',
    setup() {
      return () => h('i', { 'data-test': 'icon-moon' })
    },
  }),
  PersonCircleOutline: defineComponent({
    name: 'PersonCircleOutline',
    setup() {
      return () => h('i', { 'data-test': 'icon-user' })
    },
  }),
  SunnyOutline: defineComponent({
    name: 'SunnyOutline',
    setup() {
      return () => h('i', { 'data-test': 'icon-sun' })
    },
  }),
}))

vi.mock('naive-ui', () => ({
  NDropdown: defineComponent({
    name: 'NDropdown',
    props: {
      options: {
        type: Array,
        required: false,
      },
      onSelect: {
        type: Function,
        required: false,
      },
    },
    setup(props, { slots }) {
      const options = (props.options || []) as DropdownOption[]
      return () =>
        h('div', { 'data-test': 'n-dropdown' }, [
          h('div', { 'data-test': 'dropdown-trigger' }, slots.default?.()),
          ...options.map((option) =>
            h(
              'button',
              {
                type: 'button',
                'data-test': `dropdown-option-${String(option.key)}`,
                onClick: () => props.onSelect?.(option.key),
              },
              String(option.label ?? option.key),
            ),
          ),
        ])
    },
  }),
  NTooltip: defineComponent({
    name: 'NTooltip',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-tooltip' }, [slots.trigger?.(), slots.default?.()])
    },
  }),
  NScrollbar: defineComponent({
    name: 'NScrollbar',
    setup(_, { slots }) {
      return () => h('div', { 'data-test': 'n-scrollbar' }, slots.default?.())
    },
  }),
  NDrawer: defineComponent({
    name: 'NDrawer',
    props: {
      show: {
        type: Boolean,
        required: false,
      },
      onUpdateShow: {
        type: Function,
        required: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h(
          'div',
          {
            'data-test': 'n-drawer',
            'data-show': String(Boolean(props.show)),
          },
          slots.default?.(),
        )
    },
  }),
}))

import AuthLayoutView from '@/views/auth/AuthLayoutView'

const findClickableByText = (wrapper: VueWrapper, text: string) => {
  const node = wrapper.findAll('*').find((item) => {
    const className = item.attributes('class') || ''
    return (
      item.text().includes(text) &&
      (item.element.tagName.toLowerCase() === 'button' || className.includes('cursor-pointer'))
    )
  })

  if (!node) {
    throw new Error('clickable node not found: ' + text)
  }

  return node
}

describe('AuthLayoutView.tsx', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    routeState.name = 'dashboard'
    routeState.path = '/dashboard'
    routeState.fullPath = '/dashboard'
    routeState.meta = {
      name: 'crumb.current',
    }

    languageRef.value = 'zh-CN'
    currentThemeRef.value = 'light'

    tabsStoreState.tabList = [
      { path: '/dashboard', titleKey: 'tab.first' },
      { path: '/reports', titleKey: 'tab.second' },
    ]
    tabsStoreState.activeTab = '/dashboard'
    tabsStoreState.addTab = addTabSpy
    tabsStoreState.removeTab = removeTabSpy
    tabsStoreState.clearTabs = clearTabsSpy
    tabsStoreState.setActiveTab = setActiveTabSpy
  })

  it('adds current route tab on mount and renders router content', () => {
    const wrapper = mount(AuthLayoutView)

    expect(addTabSpy).toHaveBeenCalledWith(routeState)
    expect(wrapper.find('[data-test="error-boundary"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="router-view"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="router-slot-page"]').exists()).toBe(true)
  })

  it('handles dropdown actions for locale, theme and user menu', async () => {
    const wrapper = mount(AuthLayoutView)

    await wrapper.get('[data-test="dropdown-option-en"]').trigger('click')
    await wrapper.get('[data-test="dropdown-option-dark"]').trigger('click')
    await wrapper.get('[data-test="dropdown-option-settings"]').trigger('click')
    await wrapper.get('[data-test="dropdown-option-logout"]').trigger('click')

    expect(setLanguageSpy).toHaveBeenCalledWith('en')
    expect(setThemeSpy).toHaveBeenCalledWith('dark')
    expect(routerPushSpy).toHaveBeenCalledWith({ name: 'user-settings' })
    expect(accountLogoutSpy).toHaveBeenCalledTimes(1)
    expect(clearTabsSpy).toHaveBeenCalledTimes(1)
    expect(routerPushSpy).toHaveBeenCalledWith({ name: 'login' })
  })

  it('navigates by sidebar menu and closes active tab to next path', async () => {
    const wrapper = mount(AuthLayoutView)

    await findClickableByText(wrapper, 'menu.entry').trigger('click')
    expect(routerPushSpy).toHaveBeenCalledWith('/dashboard')

    routerPushSpy.mockClear()

    const closeTabButton = wrapper.findAll('button').find((buttonItem) => {
      const hasCloseIcon = buttonItem.find('[data-test="icon-close"]').exists()
      return hasCloseIcon && buttonItem.classes().includes('opacity-0')
    })

    if (!closeTabButton) {
      throw new Error('close tab button not found')
    }

    await closeTabButton.trigger('click')

    expect(removeTabSpy).toHaveBeenCalledWith('/dashboard')
    expect(routerPushSpy).toHaveBeenCalledWith('/after-close')
  })

  it('switches active tab and routes when tab body is clicked', async () => {
    const wrapper = mount(AuthLayoutView)

    await findClickableByText(wrapper, 'tab.second').trigger('click')

    expect(setActiveTabSpy).toHaveBeenCalledWith('/reports')
    expect(routerPushSpy).toHaveBeenCalledWith('/reports')
  })

  it('opens mobile tabs drawer and supports select/close actions', async () => {
    const wrapper = mount(AuthLayoutView)

    expect(wrapper.get('[data-test="n-drawer"]').attributes('data-show')).toBe('false')
    expect(wrapper.get('[data-test="auth-mobile-tabs-toggle"]').text()).toContain('+1')

    await wrapper.get('[data-test="auth-mobile-tabs-toggle"]').trigger('click')
    expect(wrapper.get('[data-test="n-drawer"]').attributes('data-show')).toBe('true')
    expect(wrapper.text()).toContain('layout.menu.historyTabs')

    const mobileReportTab = wrapper
      .findAll('[data-test]')
      .find((node) => node.attributes('data-test') === 'auth-mobile-tab-item-/reports')

    if (!mobileReportTab) {
      throw new Error('mobile tab item not found')
    }

    await mobileReportTab.trigger('click')
    expect(setActiveTabSpy).toHaveBeenCalledWith('/reports')
    expect(routerPushSpy).toHaveBeenCalledWith('/reports')

    routerPushSpy.mockClear()
    await wrapper.get('[data-test="auth-mobile-tabs-toggle"]').trigger('click')

    const mobileCloseButton = wrapper
      .findAll('[data-test]')
      .find((node) => node.attributes('data-test') === 'auth-mobile-tab-close-/dashboard')

    if (!mobileCloseButton) {
      throw new Error('mobile tab close button not found')
    }

    await mobileCloseButton.trigger('click')
    expect(removeTabSpy).toHaveBeenCalledWith('/dashboard')
    expect(routerPushSpy).toHaveBeenCalledWith('/after-close')
  })
})
