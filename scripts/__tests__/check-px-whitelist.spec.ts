// @vitest-environment node

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const tempRoots: string[] = []
const scriptPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'check-px-whitelist.mjs')

const createTempRoot = () => {
  const root = mkdtempSync(join(tmpdir(), 'contract-px-whitelist-'))
  tempRoots.push(root)
  return root
}

const git = (cwd: string, args: string[]) => {
  execFileSync('git', args, { cwd, encoding: 'utf8' })
}

const writeContract = (root: string) => {
  mkdirSync(join(root, 'docs', 'reference', 'api'), { recursive: true })
  writeFileSync(
    join(root, 'docs', 'reference', 'api', 'design-contract.yaml'),
    ['px_whitelist:', '  - border-width: 1px', 'radius:', '  allowed_px: []', ''].join('\n'),
  )
}

const commitAll = (root: string, message: string) => {
  git(root, ['add', '-A'])
  git(root, ['commit', '-m', message])
}

describe('check-px-whitelist', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('prefers the repository dev branch over origin/HEAD when resolving the local branch base', () => {
    const root = createTempRoot()
    git(root, ['init', '-b', 'master'])
    git(root, ['config', 'user.email', 'test@example.com'])
    git(root, ['config', 'user.name', 'Test User'])

    writeContract(root)
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(join(root, 'src', 'base.ts'), 'export const base = true\n')
    commitAll(root, 'base')

    git(root, ['checkout', '-b', 'dev'])
    const disallowedPx = `${13}px`
    writeFileSync(join(root, 'src', 'dev-only.css'), `.legacy { margin: ${disallowedPx}; }\n`)
    commitAll(root, 'dev adds legacy px')
    git(root, ['update-ref', 'refs/remotes/origin/dev', 'dev'])

    git(root, ['checkout', 'master'])
    git(root, ['update-ref', 'refs/remotes/origin/master', 'master'])
    git(root, ['symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/master'])

    git(root, ['checkout', '-b', 'integration', 'dev'])
    writeFileSync(join(root, 'src', 'integration.ts'), 'export const integration = true\n')
    commitAll(root, 'integration')

    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_BASE_REF: '',
        PX_BASE_REF: '',
      },
    })

    expect(output).toContain('check:px passed (mode=branch base=origin/dev')
  })
})
