import { defineComponent, h, nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
  mockSharedAuthRoutes,
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
  mockSharedAuthRoutes: [
    {
      name: 'dashboard',
      path: '/dashboard',
      meta: {
        name: 'menu.entry',
        icon: 'icon-dashboard',
      },
    },
    {
      name: 'work-order',
      path: '/work-order',
      meta: {
        name: 'layout.menu.workOrder',
        icon: 'workOrder.list',
      },
    },
  ],
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

vi.mock('@/router', () => ({
  authRoutes: mockSharedAuthRoutes,
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

vi.mock('lucide-vue-next', () => ({
  ChevronLeft: defineComponent({
    name: 'ChevronLeft',
    setup() {
      return () => h('i', { 'data-test': 'icon-chevron-back' })
    },
  }),
  ChevronRight: defineComponent({
    name: 'ChevronRight',
    setup() {
      return () => h('i', { 'data-test': 'icon-chevron-forward' })
    },
  }),
  X: defineComponent({
    name: 'X',
    setup() {
      return () => h('i', { 'data-test': 'icon-close' })
    },
  }),
  LogOut: defineComponent({
    name: 'LogOut',
    setup() {
      return () => h('i', { 'data-test': 'icon-logout' })
    },
  }),
  Menu: defineComponent({
    name: 'Menu',
    setup() {
      return () => h('i', { 'data-test': 'icon-menu' })
    },
  }),
  Settings: defineComponent({
    name: 'Settings',
    setup() {
      return () => h('i', { 'data-test': 'icon-settings' })
    },
  }),
  Moon: defineComponent({
    name: 'Moon',
    setup() {
      return () => h('i', { 'data-test': 'icon-moon' })
    },
  }),
  CircleUserRound: defineComponent({
    name: 'CircleUserRound',
    setup() {
      return () => h('i', { 'data-test': 'icon-user' })
    },
  }),
  Sun: defineComponent({
    name: 'Sun',
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

const mountedWrappers: VueWrapper[] = []
let addEventListenerSpy: ReturnType<typeof vi.spyOn>
let removeEventListenerSpy: ReturnType<typeof vi.spyOn>

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}

const mountAuthLayoutView = () => {
  const wrapper = mount(AuthLayoutView)
  mountedWrappers.push(wrapper)
  return wrapper
}

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
    addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    setViewportWidth(1366)

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

  afterEach(() => {
    while (mountedWrappers.length > 0) {
      mountedWrappers.pop()?.unmount()
    }

    const addedResizeListeners = addEventListenerSpy.mock.calls.filter(
      ([eventName]) => eventName === 'resize',
    )
    const removedResizeListeners = removeEventListenerSpy.mock.calls.filter(
      ([eventName]) => eventName === 'resize',
    )

    expect(removedResizeListeners).toHaveLength(addedResizeListeners.length)

    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
    mountedWrappers.length = 0
  })

  it('adds current route tab on mount and renders router content', () => {
    const wrapper = mountAuthLayoutView()

    expect(addTabSpy).toHaveBeenCalledWith(routeState)
    expect(wrapper.find('[data-test="error-boundary"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="router-view"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="router-slot-page"]').exists()).toBe(true)
  })

  it('handles dropdown actions for locale, theme and user menu', async () => {
    const wrapper = mountAuthLayoutView()

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

  it('renders desktop tab items with visible close icon and no persistent right border', async () => {
    const wrapper = mountAuthLayoutView()

    await findClickableByText(wrapper, 'menu.entry').trigger('click')
    expect(routerPushSpy).toHaveBeenCalledWith('/dashboard')

    routerPushSpy.mockClear()

    const activeTabItem = wrapper.get('[data-test="auth-desktop-tab-item-/dashboard"]')
    expect(activeTabItem.classes()).not.toContain('border-r')
    expect(activeTabItem.classes()).not.toContain('border-[var(--color-border)]')

    const closeTabButton = wrapper.get('[data-test="auth-desktop-tab-close-/dashboard"]')

    expect(closeTabButton.find('[data-test="icon-close"]').exists()).toBe(true)
    expect(closeTabButton.classes()).not.toContain('opacity-0')
    expect(closeTabButton.classes()).not.toContain('group-hover:opacity-100')

    await closeTabButton.trigger('click')

    expect(removeTabSpy).toHaveBeenCalledWith('/dashboard')
    expect(routerPushSpy).toHaveBeenCalledWith('/after-close')
  })

  it('renders menu entries from the shared auth route registry', async () => {
    const wrapper = mountAuthLayoutView()

    expect(wrapper.text()).toContain('layout.menu.workOrder')

    await findClickableByText(wrapper, 'layout.menu.workOrder').trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith('/work-order')
  })

  it('renders route icon in desktop breadcrumbs using the same route icon metadata', () => {
    const wrapper = mountAuthLayoutView()

    const breadcrumbEntry = wrapper.find('[data-test="auth-breadcrumb-item-/dashboard-0"]')

    expect(breadcrumbEntry.exists()).toBe(true)
    expect(breadcrumbEntry.find('[data-test="resolved-menu-icon"]').exists()).toBe(true)
    expect(breadcrumbEntry.text()).toContain('menu.entry')
  })

  it('switches active tab and routes when tab body is clicked', async () => {
    const wrapper = mountAuthLayoutView()

    await findClickableByText(wrapper, 'tab.second').trigger('click')

    expect(setActiveTabSpy).toHaveBeenCalledWith('/reports')
    expect(routerPushSpy).toHaveBeenCalledWith('/reports')
  })

  it('defaults to expanded sidebar on desktop viewport and compact sidebar on compact-desktop viewport', async () => {
    setViewportWidth(1366)
    const desktopWrapper = mountAuthLayoutView()
    await nextTick()

    expect(desktopWrapper.find('[data-test="icon-chevron-back"]').exists()).toBe(true)
    expect(desktopWrapper.find('[data-test="auth-mobile-active-tab"]').exists()).toBe(false)
    expect(desktopWrapper.find('[data-test="icon-menu"]').exists()).toBe(false)

    setViewportWidth(1024)
    const compactWrapper = mountAuthLayoutView()
    await nextTick()

    expect(compactWrapper.find('[data-test="icon-chevron-forward"]').exists()).toBe(true)
    expect(compactWrapper.find('[data-test="auth-mobile-active-tab"]').exists()).toBe(false)
    expect(compactWrapper.find('[data-test="icon-menu"]').exists()).toBe(false)
    expect(compactWrapper.find('[data-test="n-scrollbar"]').exists()).toBe(true)
  })

  it('resets sidebar default when re-entering compact-desktop viewport', async () => {
    setViewportWidth(1024)
    const wrapper = mountAuthLayoutView()
    await nextTick()

    const toggleButton = wrapper
      .findAll('button')
      .find((buttonItem) => buttonItem.find('[data-test="icon-chevron-forward"]').exists())

    if (!toggleButton) {
      throw new Error('sidebar toggle button not found')
    }

    await toggleButton.trigger('click')
    expect(wrapper.find('[data-test="icon-chevron-back"]').exists()).toBe(true)

    setViewportWidth(1366)
    await nextTick()
    expect(wrapper.find('[data-test="icon-chevron-back"]').exists()).toBe(true)

    setViewportWidth(1024)
    await nextTick()
    expect(wrapper.find('[data-test="icon-chevron-forward"]').exists()).toBe(true)
  })

  it('renders mobile tab controls only on mobile viewport', async () => {
    setViewportWidth(375)
    const wrapper = mountAuthLayoutView()
    await nextTick()

    expect(wrapper.find('[data-test="icon-menu"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="auth-mobile-active-tab"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="auth-mobile-tabs-toggle"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="n-scrollbar"]').exists()).toBe(false)
  })

  it('preserves expanded sidebar state when entering mobile viewport', async () => {
    setViewportWidth(1024)
    const wrapper = mountAuthLayoutView()
    await nextTick()

    const toggleButton = wrapper
      .findAll('button')
      .find((buttonItem) => buttonItem.find('[data-test="icon-chevron-forward"]').exists())

    if (!toggleButton) {
      throw new Error('sidebar toggle button not found')
    }

    await toggleButton.trigger('click')
    expect(wrapper.find('[data-test="icon-chevron-back"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('common.brand.name')

    setViewportWidth(375)
    await nextTick()

    expect(wrapper.find('[data-test="auth-mobile-active-tab"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('common.brand.name')
  })

  it('opens mobile tabs drawer and supports select/close actions', async () => {
    setViewportWidth(375)
    const wrapper = mountAuthLayoutView()

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
