import { describe, expect, it, vi } from 'vitest'
import { useI18nPlugin } from '@/app/plugins/useI18nPlugin'
import { usePiniaPlugin } from '@/app/plugins/usePiniaPlugin'
import { useRouterPlugin } from '@/app/plugins/useRouterPlugin'

const { i18nPlugin, routerPlugin } = vi.hoisted(() => ({
  i18nPlugin: { install: vi.fn() },
  routerPlugin: { install: vi.fn() },
}))

vi.mock('@/_utils/i18n', () => ({
  i18n: i18nPlugin,
}))

vi.mock('@/router', () => ({
  default: routerPlugin,
}))

describe('plugin factories', () => {
  it('useI18nPlugin returns i18n plugin object', () => {
    expect(useI18nPlugin()).toEqual({ plugin: i18nPlugin })
  })

  it('useRouterPlugin returns router plugin object', () => {
    expect(useRouterPlugin()).toEqual({ plugin: routerPlugin })
  })

  it('usePiniaPlugin returns pinia plugin instance', () => {
    const first = usePiniaPlugin()
    const second = usePiniaPlugin()
    const plugin = first.plugin as { install?: unknown }

    expect(first.plugin).toBeTruthy()
    expect(typeof plugin.install).toBe('function')
    expect(first.plugin).not.toBe(second.plugin)
  })
})
