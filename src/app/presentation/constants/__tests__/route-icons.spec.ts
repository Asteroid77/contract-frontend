import { describe, expect, it } from 'vitest'
import { routeIcons } from '@/app/presentation/constants/route-icons'

describe('routeIcons', () => {
  it('exports icon map with expected keys', () => {
    const keys = Object.keys(routeIcons)

    expect(keys.length).toBeGreaterThan(10)
    expect(keys).toContain('nav.dashboard')
    expect(keys).toContain('nav.settings')
    expect(keys).toContain('user.manage')
    expect(keys).toContain('approval.process')
    expect(keys).toContain('workOrder.list')
  })

  it('all icon entries are truthy', () => {
    for (const icon of Object.values(routeIcons)) {
      expect(icon).toBeTruthy()
    }
  })
})
