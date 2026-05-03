// @vitest-environment node

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { resolveDevServerAllowedHosts } from '../../vite.config'

const viteConfigPath = fileURLToPath(new URL('../../vite.config.ts', import.meta.url))

describe('vite config', () => {
  it('configures hidden sourcemaps for production builds', () => {
    const source = readFileSync(viteConfigPath, 'utf-8')

    expect(source).toContain("sourcemap: 'hidden'")
  })

  it('allows the configured external dev host without disabling host checks', () => {
    expect(resolveDevServerAllowedHosts(' dev.astro777.cfd ')).toEqual(['dev.astro777.cfd'])
    expect(resolveDevServerAllowedHosts('')).toEqual([])
    expect(resolveDevServerAllowedHosts(undefined)).toEqual([])
  })
})
