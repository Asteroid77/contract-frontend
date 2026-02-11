import { describe, expect, it, vi } from 'vitest'
import { setupCasl } from '@/app/plugins/casl'
import { abilitiesPlugin } from '@casl/vue'
import { ability } from '@/modules/access/application/ability'
import { canDirective } from '@/modules/access/presentation/directives/can'

vi.mock('@casl/vue', () => ({
  abilitiesPlugin: { install: vi.fn() },
}))

vi.mock('@/modules/access/application/ability', () => ({
  ability: { can: vi.fn() },
}))

vi.mock('@/modules/access/presentation/directives/can', () => ({
  canDirective: { mounted: vi.fn() },
}))

describe('setupCasl', () => {
  it('registers CASL plugin and v-can directive', () => {
    const app = {
      use: vi.fn(),
      directive: vi.fn(),
    }
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    setupCasl(app as never)

    expect(app.use).toHaveBeenCalledWith(abilitiesPlugin, ability, {
      useGlobalProperties: true,
    })
    expect(app.directive).toHaveBeenCalledWith('can', canDirective)

    consoleSpy.mockRestore()
  })
})
