// @vitest-environment node

import { mkdtempSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const resolveCommand = (command: string): string => {
  const result = spawnSync('bash', ['-lc', `command -v ${command}`], {
    encoding: 'utf-8',
  })

  if (result.status !== 0) {
    throw new Error(`Unable to resolve command: ${command}`)
  }

  return result.stdout.trim()
}

describe('check-docs script', () => {
  it('runs without requiring ripgrep in PATH', () => {
    const binDir = mkdtempSync(join(tmpdir(), 'check-docs-bin-'))

    for (const command of ['dirname', 'find', 'git']) {
      symlinkSync(resolveCommand(command), join(binDir, command))
    }

    const result = spawnSync(resolveCommand('bash'), ['scripts/check-docs.sh'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PATH: binDir,
      },
      encoding: 'utf-8',
    })

    expect(result.status).toBe(0)
    expect(result.stderr).not.toContain('ripgrep')
    expect(result.stdout).toContain('docs-check: ok')
  })
})
