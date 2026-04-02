import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { useTabsStore } from '@/app/application/stores/useTabsStore'

const createRoute = (
  partial: Partial<RouteLocationNormalizedLoaded>,
): RouteLocationNormalizedLoaded => {
  return {
    name: 'dashboard',
    path: '/dashboard',
    fullPath: '/dashboard',
    meta: {
      name: 'menu.dashboard',
      requiresAuth: true,
    },
    query: {},
    params: {},
    ...partial,
  } as unknown as RouteLocationNormalizedLoaded
}

describe('useTabsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('addTab ignores layout/root/public routes', () => {
    const store = useTabsStore()

    store.addTab(
      createRoute({
        name: 'layout',
        path: '/layout',
        fullPath: '/layout',
      }),
    )

    store.addTab(
      createRoute({
        name: 'root',
        path: '/',
        fullPath: '/',
      }),
    )

    store.addTab(
      createRoute({
        name: 'public-page',
        path: '/public',
        fullPath: '/public',
        meta: {
          name: 'menu.public',
          requiresAuth: false,
        },
      }),
    )

    expect(store.tabList).toEqual([])
    expect(store.activeTab).toBe('')
  })

  it('addTab appends tab and derives suffix from query/params id', () => {
    const store = useTabsStore()

    store.addTab(
      createRoute({
        name: 'user-detail',
        path: '/user/detail',
        fullPath: '/user/detail?id=42',
        meta: {
          name: 'menu.user.detail',
          requiresAuth: true,
        },
        query: {
          id: '42',
        },
      }),
    )

    expect(store.tabList).toHaveLength(1)
    expect(store.tabList[0]).toEqual({
      path: '/user/detail?id=42',
      name: 'user-detail',
      titleKey: 'menu.user.detail',
      titleSuffix: '#42',
    })
    expect(store.activeTab).toBe('/user/detail?id=42')

    store.addTab(
      createRoute({
        name: 'contract-detail',
        path: '/contract/detail/9',
        fullPath: '/contract/detail/9',
        meta: {
          name: 'menu.contract.detail',
          requiresAuth: true,
        },
        query: {},
        params: {
          id: '9',
        },
      }),
    )

    expect(store.tabList[1].titleSuffix).toBe('#9')
    expect(store.activeTab).toBe('/contract/detail/9')
  })

  it('addTab updates existing tab instead of duplicating', () => {
    const store = useTabsStore()

    store.addTab(
      createRoute({
        name: 'approval-detail',
        path: '/approval/1',
        fullPath: '/approval/1',
        meta: {
          name: 'menu.approval.detail',
          requiresAuth: true,
        },
        params: {
          id: '1',
        },
      }),
    )

    store.addTab(
      createRoute({
        name: 'approval-detail-updated',
        path: '/approval/1',
        fullPath: '/approval/1',
        meta: {
          name: 'menu.approval.updated',
          requiresAuth: true,
        },
        query: {
          id: '100',
        },
      }),
    )

    expect(store.tabList).toHaveLength(1)
    expect(store.tabList[0].name).toBe('approval-detail-updated')
    expect(store.tabList[0].titleKey).toBe('menu.approval.updated')
    expect(store.tabList[0].titleSuffix).toBe('#100')
  })

  it('removeTab returns fallback for missing path and clears active when empty', () => {
    const store = useTabsStore()

    expect(store.removeTab('/not-exist')).toBe('/dashboard')

    store.addTab(
      createRoute({
        name: 'single',
        path: '/single',
        fullPath: '/single',
      }),
    )

    const next = store.removeTab('/single')

    expect(next).toBe('/dashboard')
    expect(store.tabList).toEqual([])
    expect(store.activeTab).toBe('')
  })

  it('removeTab switches active tab to previous/available tab', () => {
    const store = useTabsStore()

    store.addTab(createRoute({ name: 'a', path: '/a', fullPath: '/a' }))
    store.addTab(createRoute({ name: 'b', path: '/b', fullPath: '/b' }))
    store.addTab(createRoute({ name: 'c', path: '/c', fullPath: '/c' }))

    expect(store.activeTab).toBe('/c')

    store.setActiveTab('/b')
    const nextPath = store.removeTab('/b')

    expect(nextPath).toBe('/a')
    expect(store.activeTab).toBe('/a')
    expect(store.tabList.map((tab) => tab.path)).toEqual(['/a', '/c'])
  })

  it('clearTabs resets list and activeTab', () => {
    const store = useTabsStore()

    store.addTab(createRoute({ name: 'x', path: '/x', fullPath: '/x' }))
    expect(store.tabList.length).toBe(1)

    store.clearTabs()

    expect(store.tabList).toEqual([])
    expect(store.activeTab).toBe('')
  })
})
