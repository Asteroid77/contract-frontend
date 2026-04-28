// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  TRUSTED_TYPES_DEV_CLIENT_MODULE_ID,
  TRUSTED_TYPES_DEV_CLIENT_PUBLIC_PATH,
  trustedTypesDevClientPlugin,
} from '../TrustedTypesDevClientPlugin'

describe('TrustedTypesDevClientPlugin', () => {
  it('serves a dev-only module that installs the SharedWorker Trusted Types bridge', async () => {
    const plugin = trustedTypesDevClientPlugin()

    expect(plugin.apply).toBe('serve')
    expect(plugin.enforce).toBe('post')
    expect(await plugin.resolveId?.(TRUSTED_TYPES_DEV_CLIENT_PUBLIC_PATH)).toBe(
      TRUSTED_TYPES_DEV_CLIENT_MODULE_ID,
    )
    expect(await plugin.load?.(TRUSTED_TYPES_DEV_CLIENT_MODULE_ID)).toContain(
      'installTrustedTypesWorkerConstructors',
    )
  })

  it('injects the bridge before Vite client creates its SharedWorker ping worker', async () => {
    const plugin = trustedTypesDevClientPlugin()
    const transformIndexHtml = plugin.transformIndexHtml

    expect(typeof transformIndexHtml).toBe('object')
    expect(transformIndexHtml).toEqual(expect.objectContaining({ order: 'post' }))

    const result = await (
      transformIndexHtml as Exclude<typeof transformIndexHtml, Function>
    ).handler('<html><head></head><body></body></html>', {
      path: '/index.html',
      filename: '/repo/index.html',
      server: {} as never,
    })

    expect(result).toEqual([
      {
        tag: 'script',
        attrs: {
          type: 'module',
          src: TRUSTED_TYPES_DEV_CLIENT_PUBLIC_PATH,
        },
        injectTo: 'head-prepend',
      },
    ])
  })
})
