import { describe, expect, it } from 'vitest'
import { userRoutes } from '@/router/modules/user.routes'

const getRouteByName = (name: string) => userRoutes.find((route) => route.name === name)

describe('user routes config', () => {
  it('keeps user root as transition route', () => {
    const route = getRouteByName('user')

    expect(route?.path).toBe('/user')
    expect(route?.meta?.isTransition).toBe(true)
    expect(route?.meta?.name).toBe('layout.menu.profile')
  })

  it('defines profile route as hidden child entry', () => {
    const route = getRouteByName('user-profile')

    expect(route?.path).toBe('/user/profile')
    expect(route?.meta?.parent).toBe('user')
    expect(route?.meta?.hideInMenu).toBe(true)
  })

  it('defines additional-info pending under additional-info flow', () => {
    const route = getRouteByName('user-additional-info-pending')

    expect(route?.path).toBe('/user/additional-info/pending')
    expect(route?.meta?.parent).toBe('user-additional-info')
    expect(route?.meta?.hideInMenu).toBe(true)
  })
})
