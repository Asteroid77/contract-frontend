// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const viteConfigPath = fileURLToPath(new URL('../../vite.config.ts', import.meta.url))
const shimPath = fileURLToPath(
  new URL('../../src/app/observability/otel/protobufjs-inquire-browser.cjs', import.meta.url),
)
const require = createRequire(import.meta.url)

describe('vite protobuf alias', () => {
  it('aliases protobufjs optional require probe to a CommonJS browser no-op shim', () => {
    const source = readFileSync(viteConfigPath, 'utf-8')

    expect(source).toContain("'@protobufjs/inquire'")
    expect(source).toContain('protobufjs-inquire-browser.cjs')
    expect(existsSync(shimPath)).toBe(true)

    const inquire = require(shimPath)
    expect(typeof inquire).toBe('function')
    expect(inquire('long')).toBeNull()
  })
})
