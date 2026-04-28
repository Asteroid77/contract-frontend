// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const viteConfigPath = fileURLToPath(new URL('../../vite.config.ts', import.meta.url))
const shimPath = fileURLToPath(
  new URL('../../src/app/observability/otel/protobufjs-inquire-browser.ts', import.meta.url),
)

describe('vite protobuf alias', () => {
  it('aliases protobufjs optional require probe to a browser no-op shim', () => {
    const source = readFileSync(viteConfigPath, 'utf-8')

    expect(source).toContain("'@protobufjs/inquire'")
    expect(source).toContain('protobufjs-inquire-browser.ts')
    expect(existsSync(shimPath)).toBe(true)
  })
})
