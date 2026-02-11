import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteRecordRaw } from 'vue-router'
import { renderIcon } from '@/_utils/widget/renderIcon'
import { convertRoutesToMenuItems, resolveIcon } from '@/app/presentation/layout/utils/MenuBuilder'

vi.mock('@/_utils/i18n', () => ({
  $t: (key: string) => `t:${key}`,
}))

vi.mock('@/_utils/widget/renderIcon', () => ({
  renderIcon: vi.fn((icon: unknown, raw: unknown) => ({ icon, raw })),
}))

vi.mock('@/app/presentation/constants/route-icons', () => ({
  routeIcons: {
    home: 'HomeIconComponent',
    group: 'GroupIconComponent',
  },
}))

describe('MenuBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('convertRoutesToMenuItems builds menu tree and skips hidden/invalid routes', () => {
    const routes = [
      {
        name: 'home',
        path: '/home',
        meta: {
          name: 'menu.home',
          icon: 'home',
        },
      },
      {
        name: 'group',
        path: '/group',
        meta: {
          name: 'menu.group',
          isTransition: true,
          icon: 'group',
        },
      },
      {
        name: 'groupChild',
        path: '/group/child',
        meta: {
          name: 'menu.group.child',
          parent: 'group',
        },
      },
      {
        name: 'profile',
        path: '/profile',
        meta: {
          name: 'menu.profile',
          parent: 'home',
        },
      },
      {
        name: 'hiddenRoute',
        path: '/hidden',
        meta: {
          name: 'menu.hidden',
          hideInMenu: true,
        },
      },
      {
        name: 'invalidRoute',
        path: '/invalid',
        meta: {},
      },
    ] as unknown as RouteRecordRaw[]

    const menu = convertRoutesToMenuItems(routes)

    expect(menu.map((item) => item.key)).toEqual(['home', 'group'])

    const homeMenu = menu.find((item) => item.key === 'home')
    expect(homeMenu).toBeTruthy()
    expect(homeMenu?.children?.map((item) => item.key)).toEqual(['profile'])

    const groupMenu = menu.find((item) => item.key === 'group')
    expect(groupMenu).toBeTruthy()
    expect(groupMenu?.children?.map((item) => item.key)).toEqual(['groupChild'])

    expect(homeMenu?.label).toBeTypeOf('function')
    expect(groupMenu?.label).toBeTypeOf('function')

    expect(renderIcon).toHaveBeenCalledTimes(2)
    expect(renderIcon).toHaveBeenCalledWith('HomeIconComponent', 'home')
    expect(renderIcon).toHaveBeenCalledWith('GroupIconComponent', 'group')
  })

  it('removes empty children arrays from leaf menu items', () => {
    const routes = [
      {
        name: 'leaf',
        path: '/leaf',
        meta: {
          name: 'menu.leaf',
        },
      },
    ] as unknown as RouteRecordRaw[]

    const menu = convertRoutesToMenuItems(routes)

    expect(menu).toHaveLength(1)
    expect(menu[0].children).toBeUndefined()
  })

  it('resolveIcon returns mapped icon or null for unknown key', () => {
    expect(resolveIcon('home' as never)).toBe('HomeIconComponent')
    expect(resolveIcon('unknown' as never)).toBeNull()
  })
})
