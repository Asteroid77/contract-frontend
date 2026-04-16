import { defineComponent, computed, ref, h, Transition, watch, type Component } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { NDropdown, NTooltip, NScrollbar, NDrawer } from 'naive-ui'
import {
  ChevronBackOutline,
  ChevronForwardOutline,
  CloseOutline,
  LogOutOutline,
  MenuOutline,
  SettingsOutline,
  MoonOutline,
  PersonCircleOutline,
  SunnyOutline,
} from '@vicons/ionicons5'
import { useTheme, type Theme } from '@/app/presentation/theme/hooks/useTheme'
import { useTabsStore } from '@/app/application/stores/useTabsStore'
import {
  dashboardRoutes,
  businessRoutes,
  userRoutes,
  manageRoutes,
  approvalRoutes,
} from '@/router/modules'
import { findAllParents } from '@/app/presentation/layout/utils/BreadCrumbBuilder'
import { resolveIcon, type IconNames } from '@/app/presentation/layout/utils/MenuBuilder'
import { renderIcon } from '@/_utils/widget/renderIcon'
import { useI18n } from 'vue-i18n'
import { language, setLanguage, type AppLocale } from '@/_utils/i18n'
import type { AppRouteRecord } from '@/router/types'
import { useAccountStore } from '@/modules/user/application/stores/useAccountStore'
import { resolvePlatformLabelKey } from '@/modules/user/application/utils/platform'
import { resolveUserDisplayName } from '@/modules/user/application/utils/displayName'
import ErrorBoundary from '@/app/observability/components/ErrorBoundary'
import logoSvgUrl from '@/assets/logo.svg?url'
import { useViewportMode } from '@/app/presentation/hooks/useViewportMode'

type LocaleType = AppLocale

const authRoutes: AppRouteRecord[] = [
  ...dashboardRoutes,
  ...businessRoutes,
  ...userRoutes,
  ...manageRoutes,
  ...approvalRoutes,
]

const routeInfoMap: Record<string, AppRouteRecord> = {}

for (const routeItem of authRoutes) {
  if (typeof routeItem.name === 'string') {
    routeInfoMap[routeItem.name] = routeItem
  }
}

export default defineComponent({
  name: 'auth-layout-view-vdts',
  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const route = useRoute()

    const { currentTheme, setTheme } = useTheme()
    const tabsStore = useTabsStore()
    const accountStore = useAccountStore()
    const viewportMode = useViewportMode()

    const siderCollapsed = ref(false)
    const mobileMenuOpen = ref(false)
    const mobileTabsDrawerOpen = ref(false)
    const actionIconSize = 'var(--spacing-16)'
    const sidebarAvatarSize = 'var(--spacing-32)'
    const currentLocale = computed<LocaleType>(() => language.value)
    const isMobileViewport = computed(() => viewportMode.value === 'mobile')
    const siderWidth = computed(() =>
      siderCollapsed.value ? 'var(--sider-collapsed-width)' : 'var(--sider-width)',
    )

    const menuItems = computed(() => {
      return authRoutes
        .filter((routeConfig) => {
          const routeName = routeConfig.name?.toString()
          if (!routeName || !routeConfig.meta?.name) return false
          if (routeConfig.meta.hideInMenu || routeConfig.meta.isTransition) return false

          const parentName = routeConfig.meta.parent as string | undefined
          if (!parentName) return true

          const parentRoute = routeInfoMap[parentName]
          return !!parentRoute?.meta?.isTransition
        })
        .map((routeConfig) => ({
          path: routeConfig.path,
          name: routeConfig.meta?.name as string,
          icon: routeConfig.meta?.icon as string | undefined,
        }))
    })

    const breadcrumbs = computed(() => {
      const currentName = route.name?.toString()
      const chain: AppRouteRecord[] = []

      if (currentName) {
        chain.push(...findAllParents(currentName, routeInfoMap).reverse())
        if (routeInfoMap[currentName]) {
          chain.push(routeInfoMap[currentName])
        }
      }

      if (!chain.length && route.meta?.name) {
        chain.push({
          path: route.path,
          meta: {
            name: route.meta.name,
          },
        } as AppRouteRecord)
      }

      return chain
        .filter((item) => item.meta?.name)
        .map((item) => ({
          path: item.path as string,
          title: t(item.meta?.name as string),
        }))
    })

    const localeOptions = [
      { label: '中文', key: 'zh-CN' },
      { label: 'English', key: 'en' },
    ]

    const themeOptions = computed(() => [
      { label: t('layout.theme.light'), key: 'light' },
      { label: t('layout.theme.dark'), key: 'dark' },
      { label: t('layout.theme.sakura'), key: 'sakura' },
    ])

    const userOptions = computed(() => [
      {
        label: t('layout.menu.settings'),
        key: 'settings',
        icon: () => <SettingsOutline style={{ width: actionIconSize, height: actionIconSize }} />,
      },
      {
        label: t('auth.action.logout'),
        key: 'logout',
        icon: () => <LogOutOutline style={{ width: actionIconSize, height: actionIconSize }} />,
      },
    ])

    const sidebarPlatformLabel = computed(() =>
      t(resolvePlatformLabelKey(accountStore.user.platform)),
    )

    const sidebarUserDisplayName = computed(() =>
      resolveUserDisplayName({ name: accountStore.user.name }),
    )
    const sidebarUserInitial = computed(() => sidebarUserDisplayName.value.slice(0, 1) || 'U')
    const shouldShowSidebarPlatform = computed(() => accountStore.user.platform !== 'NATIVE')
    const mobileTabsDrawerWidth = 'min(calc(var(--sider-width) + var(--spacing-80)), 88vw)'
    const activeTabTitle = computed(() => {
      const activePath = tabsStore.activeTab || route.fullPath
      const activeTab = tabsStore.tabList.find((tab) => tab.path === activePath)
      if (activeTab) {
        return `${t(activeTab.titleKey)}${activeTab.titleSuffix ?? ''}`
      }

      if (breadcrumbs.value.length > 0) {
        return breadcrumbs.value[breadcrumbs.value.length - 1].title
      }

      if (route.meta?.name) {
        return t(route.meta.name as string)
      }

      return t('layout.menu.home')
    })
    const additionalTabCount = computed(() => Math.max(tabsStore.tabList.length - 1, 0))

    watch(
      viewportMode,
      (mode) => {
        mobileMenuOpen.value = false
        mobileTabsDrawerOpen.value = false

        if (mode === 'desktop') {
          siderCollapsed.value = false
          return
        }

        if (mode === 'compact-desktop') {
          siderCollapsed.value = true
          return
        }

        siderCollapsed.value = true
      },
      { immediate: true },
    )

    watch(
      () => route.fullPath,
      () => {
        tabsStore.addTab(route)
        mobileMenuOpen.value = false
        mobileTabsDrawerOpen.value = false
      },
      { immediate: true },
    )

    const handleLocaleChange = (key: string | number) => {
      const locale: LocaleType = key === 'en' ? 'en' : 'zh-CN'
      setLanguage(locale)
    }

    const handleThemeChange = (key: string | number) => {
      const theme = key.toString() as Theme
      if (theme === 'light' || theme === 'dark' || theme === 'sakura') {
        setTheme(theme)
      }
    }

    const handleTabClose = (path: string) => {
      const nextPath = tabsStore.removeTab(path)
      if (route.fullPath === path) {
        router.push(nextPath)
      }
    }

    const handleUserAction = (key: string | number) => {
      if (key === 'settings') {
        router.push({ name: 'user-settings' })
        return
      }

      if (key === 'logout') {
        accountStore.logout()
        tabsStore.clearTabs()
        router.push({ name: 'login' })
      }
    }

    const handleMobileTabSelect = (path: string) => {
      tabsStore.setActiveTab(path)
      router.push(path)
      mobileTabsDrawerOpen.value = false
    }

    const handleMobileTabClose = (event: MouseEvent, path: string) => {
      event.stopPropagation()
      handleTabClose(path)
      if (tabsStore.tabList.length <= 1) {
        mobileTabsDrawerOpen.value = false
      }
    }

    const renderMenuIcon = (iconName?: string) => {
      if (!iconName) return null

      const ResolvedIcon = resolveIcon(iconName as IconNames)
      if (ResolvedIcon) {
        return h(ResolvedIcon, { class: 'w-5 h-5 shrink-0' })
      }

      const IconRenderer = renderIcon(null, iconName)
      return <span class="text-[20px] leading-none shrink-0">{IconRenderer()}</span>
    }

    const renderThemeIcon = () => {
      if (currentTheme.value === 'dark') {
        return <MoonOutline class="w-5 h-5" />
      }

      if (currentTheme.value === 'sakura') {
        return <span class="text-lg">🌸</span>
      }

      return <SunnyOutline class="w-5 h-5" />
    }

    return () => (
      <div class="flex h-screen overflow-hidden bg-[var(--color-bg-body)]">
        <Transition name="fade">
          {isMobileViewport.value && mobileMenuOpen.value && (
            <div
              class="fixed inset-0 bg-[var(--color-primitive-slate-950)]/45 z-40"
              onClick={() => {
                mobileMenuOpen.value = false
              }}
            />
          )}
        </Transition>

        <aside
          class={[
            'fixed md:relative z-50 h-full bg-[var(--color-bg-card)] border-r border-[var(--color-border)] transition-all duration-300 flex flex-col',
            mobileMenuOpen.value ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          ]}
          style={{
            width: siderWidth.value,
            minWidth: siderWidth.value,
            flexBasis: siderWidth.value,
          }}
        >
          <div
            class="h-16 flex items-center justify-center border-b border-[var(--color-border)] shrink-0 px-3"
            style={{ height: 'var(--header-height)', minHeight: 'var(--header-height)' }}
          >
            <div
              class={[
                'flex items-center transition-all duration-300',
                siderCollapsed.value ? '' : 'gap-2',
              ]}
            >
              <img src={logoSvgUrl} alt={t('common.brand.name')} class="w-10 h-10 object-contain" />
              {!siderCollapsed.value && (
                <span class="text-lg font-semibold tracking-wide text-[var(--color-primary)] whitespace-nowrap">
                  {t('common.brand.name')}
                </span>
              )}
            </div>
          </div>

          <nav class="flex-1 overflow-y-auto py-4 px-2">
            {menuItems.value.map((item) => (
              <NTooltip placement="right" disabled={!siderCollapsed.value} key={item.path}>
                {{
                  trigger: () => (
                    <div
                      class={[
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer mb-1 transition-all duration-150',
                        route.path === item.path
                          ? 'bg-[var(--color-primary)] text-[var(--color-bg-card)]'
                          : 'text-[var(--color-text-body)] hover:bg-[var(--color-border)]',
                      ]}
                      onClick={() => {
                        router.push(item.path)
                        mobileMenuOpen.value = false
                      }}
                    >
                      {renderMenuIcon(item.icon)}
                      {!siderCollapsed.value && (
                        <span class="text-sm font-medium truncate">{t(item.name)}</span>
                      )}
                    </div>
                  ),
                  default: () => t(item.name),
                }}
              </NTooltip>
            ))}
          </nav>

          <div class="hidden md:block border-t border-[var(--color-border)] p-3 shrink-0">
            {siderCollapsed.value ? (
              <>
                <div
                  class={[
                    'flex items-center justify-center p-2 rounded-lg cursor-pointer mb-2 transition-colors',
                    route.name === 'user-settings'
                      ? 'bg-[var(--color-primary)] text-[var(--color-bg-card)]'
                      : 'text-[var(--color-text-body)] hover:bg-[var(--color-border)]',
                  ]}
                  onClick={() => router.push({ name: 'user-settings' })}
                >
                  <SettingsOutline
                    class="shrink-0"
                    style={{ width: actionIconSize, height: actionIconSize }}
                  />
                </div>

                <div
                  class="flex items-center justify-center p-2 rounded-lg cursor-pointer transition-colors hover:bg-[var(--color-border)]"
                  onClick={() => router.push({ name: 'user-profile' })}
                >
                  <div
                    class="rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-bg-card)] text-sm font-medium shrink-0"
                    style={{
                      width: sidebarAvatarSize,
                      minWidth: sidebarAvatarSize,
                      height: sidebarAvatarSize,
                    }}
                  >
                    {sidebarUserInitial.value}
                  </div>
                </div>
              </>
            ) : (
              <div class="flex items-stretch gap-2">
                <div
                  class="flex-1 flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-[var(--color-border)]"
                  onClick={() => router.push({ name: 'user-profile' })}
                >
                  <div
                    class="rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--color-bg-card)] text-sm font-medium shrink-0"
                    style={{
                      width: sidebarAvatarSize,
                      minWidth: sidebarAvatarSize,
                      height: sidebarAvatarSize,
                    }}
                  >
                    {sidebarUserInitial.value}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-[var(--color-text-main)] truncate">
                      {sidebarUserDisplayName.value || t('layout.menu.profile')}
                    </div>
                    <div class="text-xs text-[var(--color-text-light)] truncate">
                      {`${t('layout.profile.field.phone')}: ${accountStore.user.phone || '-'}`}
                    </div>
                    {shouldShowSidebarPlatform.value && (
                      <div class="text-xs text-[var(--color-text-light)] truncate">
                        {`${t('layout.profile.field.platform')}: ${sidebarPlatformLabel.value}`}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  class={[
                    'w-11 rounded-lg flex items-center justify-center cursor-pointer transition-colors shrink-0',
                    route.name === 'user-settings'
                      ? 'bg-[var(--color-primary)] text-[var(--color-bg-card)]'
                      : 'text-[var(--color-text-body)] hover:bg-[var(--color-border)]',
                  ]}
                  onClick={() => router.push({ name: 'user-settings' })}
                >
                  <SettingsOutline
                    class="shrink-0"
                    style={{ width: actionIconSize, height: actionIconSize }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            class="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-full items-center justify-center text-[var(--color-text-light)] hover:text-[var(--color-text-main)] hover:shadow-md transition-all"
            onClick={() => {
              siderCollapsed.value = !siderCollapsed.value
            }}
          >
            {siderCollapsed.value ? (
              <ChevronForwardOutline class="w-3.5 h-3.5" />
            ) : (
              <ChevronBackOutline class="w-3.5 h-3.5" />
            )}
          </button>

          <button
            class="md:hidden absolute top-4 right-4 p-1 text-[var(--color-text-light)]"
            onClick={() => {
              mobileMenuOpen.value = false
            }}
          >
            <CloseOutline class="w-5 h-5" />
          </button>
        </aside>

        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header
            class="h-16 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] flex items-center px-4 gap-4 shrink-0"
            style={{ height: 'var(--header-height)', minHeight: 'var(--header-height)' }}
          >
            <button
              class="md:hidden p-2 rounded-lg hover:bg-[var(--color-border)] text-[var(--color-text-body)]"
              onClick={() => {
                mobileMenuOpen.value = true
              }}
            >
              <MenuOutline class="w-5 h-5" />
            </button>

            {isMobileViewport.value ? (
              <div class="flex-1 min-w-0 flex items-center justify-end gap-2 overflow-hidden">
                <button
                  class="min-w-0 max-w-full px-3 py-1.5 rounded-md text-sm font-medium text-[var(--color-text-main)] bg-[var(--color-border)]/70 truncate"
                  onClick={() => {
                    if (additionalTabCount.value > 0) {
                      mobileTabsDrawerOpen.value = true
                    }
                  }}
                  data-test="auth-mobile-active-tab"
                >
                  {activeTabTitle.value}
                </button>
                {additionalTabCount.value > 0 && (
                  <button
                    class="px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--color-text-body)] bg-[var(--color-border)] hover:bg-[var(--color-border)]/80 transition-colors"
                    onClick={() => {
                      mobileTabsDrawerOpen.value = true
                    }}
                    data-test="auth-mobile-tabs-toggle"
                  >
                    {`+${additionalTabCount.value}`}
                  </button>
                )}
              </div>
            ) : (
              <div class="flex-1 items-center gap-2 text-sm min-w-0 overflow-x-auto pl-[var(--spacing-sm)] hidden md:flex">
                {breadcrumbs.value.map((crumb, index) => (
                  <div class="flex items-center gap-2 shrink-0" key={`${crumb.path}-${index}`}>
                    {index > 0 && (
                      <span class="text-sm font-medium leading-none text-[var(--color-text-light)] shrink-0">
                        {'>'}
                      </span>
                    )}
                    <span
                      class={[
                        'truncate',
                        index === breadcrumbs.value.length - 1
                          ? 'text-[var(--color-text-main)] font-medium'
                          : 'text-[var(--color-text-light)]',
                      ]}
                    >
                      {crumb.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div class="flex items-center gap-2">
              <NDropdown options={localeOptions} onSelect={handleLocaleChange} trigger="click">
                <button class="p-2 rounded-lg hover:bg-[var(--color-border)] text-[var(--color-text-body)] text-sm font-medium">
                  {currentLocale.value === 'zh-CN' ? '文' : 'A'}
                </button>
              </NDropdown>

              <NDropdown options={themeOptions.value} onSelect={handleThemeChange} trigger="click">
                <button class="p-2 rounded-lg hover:bg-[var(--color-border)] text-[var(--color-text-body)]">
                  {renderThemeIcon()}
                </button>
              </NDropdown>

              <NDropdown options={userOptions.value} onSelect={handleUserAction} trigger="click">
                <button class="p-1 rounded-lg hover:bg-[var(--color-border)] text-[var(--color-text-body)]">
                  <PersonCircleOutline class="w-6 h-6" />
                </button>
              </NDropdown>
            </div>
          </header>

          {!isMobileViewport.value && (
            <div class="h-10 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] px-2 shrink-0">
              <NScrollbar xScrollable trigger="hover" size={3} class="h-full" contentClass="h-full">
                <div class="h-full flex items-center gap-1 w-max min-w-full">
                  {tabsStore.tabList.map((tab) => (
                    <div
                      key={tab.path}
                      class={[
                        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors whitespace-nowrap group',
                        tabsStore.activeTab === tab.path
                          ? 'bg-[var(--color-primary)] text-[var(--color-bg-card)]'
                          : 'text-[var(--color-text-body)] hover:bg-[var(--color-border)]',
                      ]}
                      onClick={() => {
                        tabsStore.setActiveTab(tab.path)
                        router.push(tab.path)
                      }}
                    >
                      <span class="truncate max-w-40">{`${t(tab.titleKey)}${tab.titleSuffix ?? ''}`}</span>
                      {tabsStore.tabList.length > 1 && (
                        <button
                          class={[
                            'opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity',
                            tabsStore.activeTab === tab.path
                              ? 'hover:bg-[var(--color-bg-card)]/20'
                              : 'hover:bg-[var(--color-text-light)]/20',
                          ]}
                          onClick={(event) => {
                            event.stopPropagation()
                            handleTabClose(tab.path)
                          }}
                        >
                          <CloseOutline class="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </NScrollbar>
            </div>
          )}

          <NDrawer
            show={mobileTabsDrawerOpen.value}
            placement="right"
            width={mobileTabsDrawerWidth}
            onUpdateShow={(show) => {
              mobileTabsDrawerOpen.value = show
            }}
          >
            <div class="h-full bg-[var(--color-bg-card)] border-l border-[var(--color-border)] flex flex-col">
              <div class="h-12 px-4 border-b border-[var(--color-border)] relative flex items-center justify-center shrink-0">
                <span class="max-w-[70%] text-center truncate text-sm font-semibold text-[var(--color-text-main)]">
                  {t('layout.menu.historyTabs')}
                </span>
                <button
                  class="absolute right-4 p-1.5 rounded-md text-[var(--color-text-light)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-border)]"
                  onClick={() => {
                    mobileTabsDrawerOpen.value = false
                  }}
                  data-test="auth-mobile-tabs-close"
                >
                  <CloseOutline class="w-4 h-4" />
                </button>
              </div>
              <div class="flex-1 overflow-y-auto p-2">
                {tabsStore.tabList.map((tab) => (
                  <div
                    key={`mobile-${tab.path}`}
                    class={[
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors mb-1 group',
                      tabsStore.activeTab === tab.path
                        ? 'bg-[var(--color-primary)] text-[var(--color-bg-card)]'
                        : 'text-[var(--color-text-body)] hover:bg-[var(--color-border)]',
                    ]}
                    onClick={() => handleMobileTabSelect(tab.path)}
                    data-test={`auth-mobile-tab-item-${tab.path}`}
                  >
                    <span class="flex-1 min-w-0 truncate">{`${t(tab.titleKey)}${tab.titleSuffix ?? ''}`}</span>
                    {tabsStore.tabList.length > 1 && (
                      <button
                        class={[
                          'p-0.5 rounded transition-colors',
                          tabsStore.activeTab === tab.path
                            ? 'hover:bg-[var(--color-bg-card)]/20'
                            : 'hover:bg-[var(--color-text-light)]/20',
                        ]}
                        onClick={(event) => handleMobileTabClose(event, tab.path)}
                        data-test={`auth-mobile-tab-close-${tab.path}`}
                      >
                        <CloseOutline class="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </NDrawer>

          <main class="flex-1 overflow-auto">
            <div class="max-w-[var(--layout-content-max-width)] mx-auto w-full p-4 md:p-6 min-h-full">
              <ErrorBoundary key={route.fullPath}>
                <RouterView>
                  {{
                    default: ({
                      Component: RouteComponent,
                    }: {
                      Component: Component | undefined
                    }) =>
                      RouteComponent
                        ? h(
                            Transition,
                            { name: 'page', mode: 'out-in' },
                            { default: () => h(RouteComponent, { key: route.fullPath }) },
                          )
                        : null,
                  }}
                </RouterView>
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    )
  },
})
