import { describe, expect, it } from 'vitest'
import { userRoutes } from '@/router/modules/user.routes'

const getRouteByName = (name: string) => userRoutes.find((route) => route.name === name)

describe('user routes config', () => {
  it('keeps user root as transition route', () => {
    const route = getRouteByName('user')

    expect(route?.path).toBe('/user')
    expect(route?.meta?.isTransition).toBe(true)
    expect(route?.meta?.name).toBe('layout.menu.profile')
    expect(route?.meta?.icon).toBe('nav.user')
  })

  it('defines profile route as hidden child entry', () => {
    const route = getRouteByName('user-profile')

    expect(route?.path).toBe('/user/profile')
    expect(route?.meta?.parent).toBe('user')
    expect(route?.meta?.icon).toBe('user.profile')
    expect(route?.meta?.hideInMenu).toBe(true)
  })

  it('defines additional-info pending under additional-info flow', () => {
    const route = getRouteByName('user-additional-info-pending')

    expect(route?.path).toBe('/user/additional-info/pending')
    expect(route?.meta?.parent).toBe('user-additional-info')
    expect(route?.meta?.icon).toBe('user.profile')
    expect(route?.meta?.hideInMenu).toBe(true)
  })

  it('uses semantic lucide icon keys for visible user entries', () => {
    expect(getRouteByName('user-settings')?.meta?.icon).toBe('nav.settings')
    expect(getRouteByName('user-agent-list')?.meta?.icon).toBe('user.agents')
    expect(getRouteByName('my-sign')?.meta?.icon).toBe('agreement.selfSign')
  })
})
