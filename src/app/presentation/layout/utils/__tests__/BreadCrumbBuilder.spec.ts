import { describe, expect, it } from 'vitest'
import type { RouteRecordRaw } from 'vue-router'
import { findAllParents } from '@/app/presentation/layout/utils/BreadCrumbBuilder'

describe('BreadCrumbBuilder/findAllParents', () => {
  const routeInfoMap = {
    root: {
      name: 'root',
      path: '/root',
      meta: {
        name: 'menu.root',
      },
    },
    child: {
      name: 'child',
      path: '/child',
      meta: {
        name: 'menu.child',
        parent: 'root',
      },
    },
    grand: {
      name: 'grand',
      path: '/grand',
      meta: {
        name: 'menu.grand',
        parent: 'child',
      },
    },
  } as unknown as Record<string, RouteRecordRaw>

  it('returns parent chain from direct parent to top parent', () => {
    const result = findAllParents('grand', routeInfoMap)

    expect(result.map((route) => route.name)).toEqual(['child', 'root'])
  })

  it('returns empty array for route without parent or unknown route', () => {
    expect(findAllParents('root', routeInfoMap)).toEqual([])
    expect(findAllParents('missing', routeInfoMap)).toEqual([])
  })
})
