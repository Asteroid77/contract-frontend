import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/views/unauth/LoginView', () => ({
  default: defineComponent({
    name: 'LoginViewStub',
    setup: () => () => null,
  }),
}))

import { unauthRoutes } from '@/router/modules/unauth.routes'

const getRouteByName = (name: string) => unauthRoutes.find((route) => route.name === name)
const getRouteByPath = (path: string) => unauthRoutes.find((route) => route.path === path)

describe('unauth routes config', () => {
  it('sets unauth layout and no-auth flags for login route', () => {
    const route = getRouteByName('login')

    expect(route?.path).toBe('/login')
    expect(route?.meta?.layout).toBe('unauth')
    expect(route?.meta?.requiresAuth).toBe(false)
  })

  it('redirects oauth2 callback and keeps original query', () => {
    const route = getRouteByPath('/unauth/oauth2/callback')
    const redirect = route?.redirect as
      | ((route: { query: Record<string, unknown> }) => unknown)
      | undefined

    expect(redirect?.({ query: { code: 'abc', state: 'xyz' } })).toEqual({
      name: 'oauth2-callback',
      query: { code: 'abc', state: 'xyz' },
    })
  })

  it('preview attachments props converts query type/id to number or null', () => {
    const route = getRouteByName('approval-preview-attachments')
    const props = route?.props as
      | ((route: { query: Record<string, unknown> }) => unknown)
      | undefined

    expect(props?.({ query: { type: '1', id: '99' } })).toEqual({ type: 1, id: 99 })
    expect(props?.({ query: { type: 'NaN', id: '' } })).toEqual({ type: null, id: null })
  })
})
