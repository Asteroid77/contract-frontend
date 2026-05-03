import { describe, expect, it } from 'vitest'
import { businessRoutes } from '@/router/modules/business.routes'

const getRouteByName = (name: string) => businessRoutes.find((route) => route.name === name)

describe('business routes config', () => {
  it('uses semantic lucide icon keys for navigable menu entries', () => {
    expect(getRouteByName('business')?.meta?.icon).toBe('nav.business')
    expect(getRouteByName('invitation')?.meta?.icon).toBe('business.invitation')
    expect(getRouteByName('sign-page')?.meta?.icon).toBe('agreement.signList')
    expect(getRouteByName('sign')?.meta?.icon).toBe('icon-qianyue')
    expect(getRouteByName('sign-result')?.meta?.icon).toBe('icon-qianyueliebiao')
  })

  it('defines sign route with parent sign-page', () => {
    const route = getRouteByName('sign')

    expect(route?.path).toBe('/sign')
    expect(route?.meta?.parent).toBe('sign-page')
  })

  it('sign route props converts query id to number or null', () => {
    const route = getRouteByName('sign')
    const props = route?.props as
      | ((route: { query: Record<string, unknown> }) => unknown)
      | undefined

    expect(props?.({ query: { id: '12' } })).toEqual({ id: 12 })
    expect(props?.({ query: { id: '' } })).toEqual({ id: null })
    expect(props?.({ query: { id: 'abc' } })).toEqual({ id: null })
  })

  it('sign-result route keeps hidden menu and parses status/id', () => {
    const route = getRouteByName('sign-result')
    const props = route?.props as
      | ((route: { query: Record<string, unknown> }) => unknown)
      | undefined

    expect(route?.meta?.hideInMenu).toBe(true)
    expect(props?.({ query: { status: '2', id: '33' } })).toEqual({ status: 2, id: 33 })
    expect(props?.({ query: { status: undefined, id: null } })).toEqual({ status: null, id: null })
  })
})
