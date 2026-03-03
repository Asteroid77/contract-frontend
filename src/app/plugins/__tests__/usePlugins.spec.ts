import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getInstalledPlugins, usePlugins } from '@/app/plugins/usePlugins'
import { registerPostLoginEnhancementApp } from '@/app/plugins/post-login-enhancements'
import { useI18nPlugin } from '@/app/plugins/useI18nPlugin'
import { usePiniaPlugin } from '@/app/plugins/usePiniaPlugin'
import { useRequestPlugin } from '@/app/plugins/useRequestPlugin'
import { useRouterPlugin } from '@/app/plugins/useRouterPlugin'

const { plugins, requestCallback } = vi.hoisted(() => {
  const i18n = { install: vi.fn() }
  const pinia = { install: vi.fn() }
  const router = { install: vi.fn() }
  const request = { install: vi.fn() }

  return {
    plugins: { i18n, pinia, router, request },
    requestCallback: vi.fn(),
  }
})

vi.mock('@/app/plugins/post-login-enhancements', () => ({
  registerPostLoginEnhancementApp: vi.fn(),
}))

vi.mock('@/app/plugins/useI18nPlugin', () => ({
  useI18nPlugin: vi.fn(),
}))

vi.mock('@/app/plugins/usePiniaPlugin', () => ({
  usePiniaPlugin: vi.fn(),
}))

vi.mock('@/app/plugins/useRouterPlugin', () => ({
  useRouterPlugin: vi.fn(),
}))

vi.mock('@/app/plugins/useRequestPlugin', () => ({
  useRequestPlugin: vi.fn(),
}))

describe('usePlugins', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getInstalledPlugins().value.clear()

    vi.mocked(useI18nPlugin).mockReturnValue({ plugin: plugins.i18n } as never)
    vi.mocked(usePiniaPlugin).mockReturnValue({ plugin: plugins.pinia } as never)
    vi.mocked(useRouterPlugin).mockReturnValue({ plugin: plugins.router } as never)
    vi.mocked(useRequestPlugin).mockReturnValue({
      plugin: plugins.request,
      callback: requestCallback,
    } as never)
  })

  it('installs all configured plugins and registers app for post-login enhancements', () => {
    const app = {
      use: vi.fn(),
    }

    usePlugins(app as never)

    expect(useI18nPlugin).toHaveBeenCalledTimes(1)
    expect(usePiniaPlugin).toHaveBeenCalledTimes(1)
    expect(useRouterPlugin).toHaveBeenCalledTimes(1)
    expect(useRequestPlugin).toHaveBeenCalledTimes(1)

    expect(app.use).toHaveBeenCalledTimes(4)
    expect(app.use).toHaveBeenCalledWith(plugins.i18n)
    expect(app.use).toHaveBeenCalledWith(plugins.pinia)
    expect(app.use).toHaveBeenCalledWith(plugins.router)
    expect(app.use).toHaveBeenCalledWith(plugins.request)

    expect(requestCallback).toHaveBeenCalledTimes(1)
    expect(registerPostLoginEnhancementApp).toHaveBeenCalledWith(app)
    expect(getInstalledPlugins().value.size).toBe(4)
  })

  it('does not install duplicated plugin instances on repeated calls', () => {
    const app = {
      use: vi.fn(),
    }

    usePlugins(app as never)
    usePlugins(app as never)

    // 第二次调用会再次执行工厂函数，但 _usePlugin 会去重
    expect(app.use).toHaveBeenCalledTimes(4)
    expect(requestCallback).toHaveBeenCalledTimes(2)
    expect(registerPostLoginEnhancementApp).toHaveBeenCalledTimes(2)
    expect(getInstalledPlugins().value.size).toBe(4)
  })
})
