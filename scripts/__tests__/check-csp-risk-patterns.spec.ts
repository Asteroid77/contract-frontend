// @vitest-environment node

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  collectCspRiskFindings,
  formatCspRiskFindings,
  shouldFailForMode,
} from '../check-csp-risk-patterns.mjs'

const tempRoots: string[] = []

const createTempRoot = () => {
  const root = mkdtempSync(join(tmpdir(), 'contract-csp-risk-'))
  tempRoots.push(root)
  return root
}

describe('check-csp-risk-patterns', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('detects remote CDN URLs and unsafe JavaScript execution patterns', () => {
    const root = createTempRoot()
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(
      join(root, 'src', 'risky.ts'),
      `
const cssHref = 'https://unpkg.com/cropperjs@1.6.2/dist/cropper.min.css'
const factory = new Function('return 1')
eval('console.log("unsafe")')
setTimeout('console.log("unsafe timeout")', 100)
setInterval("console.log('unsafe interval')", 100)
`,
    )

    const findings = collectCspRiskFindings({
      root,
      targets: ['src'],
    })

    expect(findings.map((finding) => finding.patternId)).toEqual([
      'remote-cdn-unpkg',
      'unsafe-new-function',
      'unsafe-eval',
      'unsafe-string-set-timeout',
      'unsafe-string-set-interval',
    ])
    expect(findings.every((finding) => finding.file.endsWith('src/risky.ts'))).toBe(true)
  })

  it('detects Trusted Types relevant HTML sinks in source files', () => {
    const root = createTempRoot()
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(
      join(root, 'src', 'html-sinks.ts'),
      `
target.innerHTML = '<p>unsafe</p>'
target.outerHTML = '<div>unsafe</div>'
target.insertAdjacentHTML('beforeend', html)
document.write('<style>.x{}</style>')
new DOMParser().parseFromString(markup, 'text/html')
range.createContextualFragment(markup)
trustedTypes.createPolicy('unsafe-policy', { createHTML: (value) => value })
`,
    )
    writeFileSync(
      join(root, 'src', 'unsafe-template.vue'),
      '<template><div v-html="html"></div></template>',
    )

    const findings = collectCspRiskFindings({
      root,
      targets: ['src'],
    })

    expect(findings.map((finding) => finding.patternId)).toEqual([
      'unsafe-inner-html',
      'unsafe-outer-html',
      'unsafe-insert-adjacent-html',
      'unsafe-document-write',
      'unsafe-domparser-parse-from-string',
      'unsafe-create-contextual-fragment',
      'unsafe-trusted-types-create-policy',
      'unsafe-v-html',
    ])
  })

  it('ignores generated and dependency folders when scanning a project path', () => {
    const root = createTempRoot()
    mkdirSync(join(root, 'src'), { recursive: true })
    mkdirSync(join(root, 'src', 'node_modules'), { recursive: true })
    mkdirSync(join(root, 'src', '.git'), { recursive: true })
    writeFileSync(join(root, 'src', 'safe.ts'), 'export const value = 1')
    writeFileSync(join(root, 'src', 'node_modules', 'dep.js'), 'eval("ignored")')
    writeFileSync(join(root, 'src', '.git', 'hook.js'), 'new Function("ignored")')

    expect(collectCspRiskFindings({ root, targets: ['src'] })).toEqual([])
  })

  it('ignores explicitly allowlisted generated and test files', () => {
    const root = createTempRoot()
    mkdirSync(join(root, 'src', 'assets', 'iconfont', 'vendor'), { recursive: true })
    mkdirSync(join(root, 'src', 'modules', 'approval', 'presentation', 'print', '__tests__'), {
      recursive: true,
    })
    mkdirSync(join(root, 'vite-plugin', '__tests__'), { recursive: true })
    writeFileSync(
      join(root, 'src', 'assets', 'iconfont', 'vendor', 'iconfont.js'),
      'document.write("<style></style>")',
    )
    writeFileSync(
      join(
        root,
        'src',
        'modules',
        'approval',
        'presentation',
        'print',
        '__tests__',
        'printUtils.spec.ts',
      ),
      'document.body.innerHTML = ""',
    )
    writeFileSync(
      join(root, 'vite-plugin', '__tests__', 'IconfontSpriteVitePlugin.spec.ts'),
      'expect(code).not.toContain("innerHTML")',
    )

    const findings = collectCspRiskFindings({
      root,
      targets: ['src', 'vite-plugin'],
    })

    expect(findings).toEqual([])
  })

  it('fails src scans but keeps dist and package scans report-only by default', () => {
    expect(shouldFailForMode({ mode: 'src', findingsCount: 1 })).toBe(true)
    expect(shouldFailForMode({ mode: 'src', findingsCount: 0 })).toBe(false)
    expect(shouldFailForMode({ mode: 'dist', findingsCount: 1 })).toBe(false)
    expect(shouldFailForMode({ mode: 'package', findingsCount: 1 })).toBe(false)
  })

  it('formats findings with file, line, pattern and matched text', () => {
    const output = formatCspRiskFindings([
      {
        file: 'src/risky.ts',
        line: 2,
        column: 15,
        patternId: 'unsafe-new-function',
        label: 'unsafe dynamic code execution',
        match: 'new Function',
      },
    ])

    expect(output).toContain('src/risky.ts:2:15')
    expect(output).toContain('unsafe-new-function')
    expect(output).toContain('new Function')
  })
})
