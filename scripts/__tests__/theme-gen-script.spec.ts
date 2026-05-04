// @vitest-environment node

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import packageJson from '../../package.json'
import { describe, expect, it } from 'vitest'

describe('theme generation script', () => {
  it('points package.json theme:gen to an existing script entry', () => {
    const command = packageJson.scripts['theme:gen']
    const scriptPath = command.match(/\.\/scripts\/\S+/)?.[0]

    expect(scriptPath).toBe('./scripts/generate-theme.mjs')
    expect(existsSync(resolve(process.cwd(), scriptPath))).toBe(true)
  })
})
