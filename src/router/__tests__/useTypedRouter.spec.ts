import { beforeEach, describe, expect, it, vi } from 'vitest'

const { pushSpy, replaceSpy, useRouterSpy, useRouteSpy, routeState } = vi.hoisted(() => {
  const push = vi.fn().mockResolvedValue(undefined)
  const replace = vi.fn().mockResolvedValue(undefined)
  const router = { push, replace }

  const currentRoute = {
    name: 'dashboard',
    matched: [{ name: 'dashboard' }],
  }

  return {
    pushSpy: push,
    replaceSpy: replace,
    useRouterSpy: vi.fn(() => router),
    useRouteSpy: vi.fn(() => currentRoute),
    routeState: currentRoute,
  }
})

vi.mock('vue-router', () => ({
  useRouter: useRouterSpy,
  useRoute: useRouteSpy,
}))

import {
  isCurrentRoute,
  isUnderRoute,
  pushByName,
  replaceByName,
  routeTo,
  useTypedRoute,
  useTypedRouter,
} from '@/router/useTypedRouter'

describe('useTypedRouter helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.name = 'dashboard'
    routeState.matched = [{ name: 'dashboard' }]
  })

  it('useTypedRouter returns vue-router instance', () => {
    const router = useTypedRouter()

    expect(useRouterSpy).toHaveBeenCalledTimes(1)
    expect(router.push).toBe(pushSpy)
    expect(router.replace).toBe(replaceSpy)
  })

  it('useTypedRoute returns current route', () => {
    const route = useTypedRoute()

    expect(useRouteSpy).toHaveBeenCalledTimes(1)
    expect(route).toBe(routeState)
  })

  it('pushByName delegates to router.push with query payload', async () => {
    await pushByName('sign', { id: 12 } as never)

    expect(pushSpy).toHaveBeenCalledWith({
      name: 'sign',
      query: { id: 12 },
    })
  })

  it('replaceByName delegates to router.replace with query payload', async () => {
    await replaceByName('login')

    expect(replaceSpy).toHaveBeenCalledWith({
      name: 'login',
      query: undefined,
    })
  })

  it('routeTo builds typed route location object', () => {
    expect(routeTo('dashboard')).toEqual({ name: 'dashboard', query: undefined })
    expect(routeTo('sign', { id: '7' })).toEqual({
      name: 'sign',
      query: { id: '7' },
    })
  })

  it('isCurrentRoute checks current name', () => {
    routeState.name = 'sign'

    expect(isCurrentRoute('sign')).toBe(true)
    expect(isCurrentRoute('dashboard')).toBe(false)
  })

  it('isUnderRoute checks current route and matched chain', () => {
    routeState.name = 'sign-result'
    routeState.matched = [{ name: 'business' }, { name: 'sign' }, { name: 'sign-result' }]

    expect(isUnderRoute('sign')).toBe(true)
    expect(isUnderRoute('dashboard')).toBe(false)
  })
})
