// @vitest-environment node

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const viteConfigPath = fileURLToPath(new URL('../../vite.config.ts', import.meta.url))

describe('vite config', () => {
  it('configures hidden sourcemaps for production builds', () => {
    const source = readFileSync(viteConfigPath, 'utf-8')

    expect(source).toContain("sourcemap: 'hidden'")
  })
})
