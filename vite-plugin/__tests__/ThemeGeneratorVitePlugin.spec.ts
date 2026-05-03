// @vitest-environment node

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  generateThemeCss,
  generateThemeCssAsset,
  themeGeneratorPlugin,
} from '../ThemeGeneratorVitePlugin'

const tempRoots: string[] = []

const createTempRoot = () => {
  const root = mkdtempSync(join(tmpdir(), 'contract-theme-gen-'))
  tempRoots.push(root)
  return root
}

describe('ThemeGeneratorVitePlugin', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('emits CSS in the same format accepted by the formatter', () => {
    const css = generateThemeCss()

    expect(css).toContain(
      "  --font-sans: 'Inter', 'Noto Sans SC', ui-sans-serif, -apple-system, sans-serif;",
    )
    expect(css).toContain('  --color-primitive-slate-50: #f8fafc;')
    expect(css).toContain('  --motion-duration-fast: 150ms;')
    expect(css).toContain('  --motion-easing-standard: cubic-bezier(0.4, 0, 0.2, 1);')
    expect(css).toContain('  --motion-scale-press: 0.98;')
    expect(css).toContain('  --layer-modal: 1200;')
    expect(css).toContain('  --opacity-disabled: 0.48;')
    expect(css).toContain('  --elevation-modal: 0 16px 32px rgba(0, 0, 0, 0.16);')
    expect(css).toContain('  --border-width-default: 1px;')
    expect(css).toContain('  --color-overlay-scrim: rgba(15, 23, 42, 0.5);')
    expect(css).not.toContain('#F8FAFC')
    expect(css).not.toMatch(/\n\n$/)
  })

  it('writes generated theme CSS and metadata through the shared asset pipeline', () => {
    const root = createTempRoot()
    const outputPath = join(root, 'generated-theme.css')
    const metaPath = join(root, 'generated-theme.meta.json')

    const result = generateThemeCssAsset({
      outputPath,
      metaPath,
    })

    expect(result.changed).toBe(true)
    expect(readFileSync(outputPath, 'utf8')).toContain('@theme')

    const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as Record<string, unknown>
    expect(meta).toEqual(
      expect.objectContaining({
        name: 'theme-css',
        hash: result.hash,
        output: outputPath,
      }),
    )
  })

  it('does not rewrite generated files when ThemeToken output is unchanged', () => {
    const root = createTempRoot()
    const outputPath = join(root, 'generated-theme.css')
    const metaPath = join(root, 'generated-theme.meta.json')

    generateThemeCssAsset({
      outputPath,
      metaPath,
    })

    const result = generateThemeCssAsset({
      outputPath,
      metaPath,
    })

    expect(result.changed).toBe(false)
  })

  it('reports generated theme drift in check mode without writing files', () => {
    const root = createTempRoot()
    const outputPath = join(root, 'generated-theme.css')
    const metaPath = join(root, 'generated-theme.meta.json')

    const result = generateThemeCssAsset({
      outputPath,
      metaPath,
      check: true,
    })

    expect(result.drifted).toBe(true)
    expect(existsSync(outputPath)).toBe(false)
    expect(existsSync(metaPath)).toBe(false)
  })

  it('only reloads dev server when the ThemeToken source changes and generated CSS changed', () => {
    const root = createTempRoot()
    const sourcePath = join(root, 'ThemeToken.ts')
    const outputPath = join(root, 'generated-theme.css')
    const metaPath = join(root, 'generated-theme.meta.json')
    const plugin = themeGeneratorPlugin({
      sourcePath,
      outputPath,
      metaPath,
    })
    const server = {
      ws: {
        send: vi.fn(),
      },
    }

    plugin.handleHotUpdate?.({
      file: join(root, 'OtherThemeToken.ts'),
      server,
    } as never)
    expect(server.ws.send).not.toHaveBeenCalled()

    plugin.handleHotUpdate?.({
      file: sourcePath,
      server,
    } as never)
    expect(server.ws.send).toHaveBeenCalledWith({
      type: 'full-reload',
      path: '*',
    })

    server.ws.send.mockClear()
    plugin.handleHotUpdate?.({
      file: sourcePath,
      server,
    } as never)
    expect(server.ws.send).not.toHaveBeenCalled()
  })
})
