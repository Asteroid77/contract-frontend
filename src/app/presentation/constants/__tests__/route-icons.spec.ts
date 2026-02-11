import { describe, expect, it } from 'vitest'
import { routeIcons } from '@/app/presentation/constants/route-icons'

describe('routeIcons', () => {
  it('exports icon map with expected keys', () => {
    const keys = Object.keys(routeIcons)

    expect(keys.length).toBeGreaterThan(10)
    expect(keys).toContain('UserData')
    expect(keys).toContain('ApprovalFilled')
    expect(keys).toContain('SettingsOutline')
  })

  it('all icon entries are truthy', () => {
    for (const icon of Object.values(routeIcons)) {
      expect(icon).toBeTruthy()
    }
  })
})
