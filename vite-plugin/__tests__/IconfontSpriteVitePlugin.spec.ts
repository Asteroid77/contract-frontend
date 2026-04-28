// @vitest-environment node

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  generateIconfontSprite,
  parseIconfontSvgFromJs,
  validateIconfontSvg,
} from '../IconfontSpriteVitePlugin'

const tempRoots: string[] = []

const createTempRoot = () => {
  const root = mkdtempSync(join(tmpdir(), 'contract-iconfont-'))
  tempRoots.push(root)
  return root
}

const iconfontJs = `
window._iconfont_svg_string_123='<svg><symbol id="icon-demo" viewBox="0 0 1024 1024"><path d="M0 0h10v10z" fill="#fff"></path><path d="M1 1h2v2z"></path></symbol></svg>';
(function(){document.write("unsafe wrapper");})(window);
`

describe('IconfontSpriteVitePlugin helpers', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('extracts only the embedded SVG string from vendor iconfont JavaScript', () => {
    expect(parseIconfontSvgFromJs(iconfontJs)).toBe(
      '<svg><symbol id="icon-demo" viewBox="0 0 1024 1024"><path d="M0 0h10v10z" fill="#fff"></path><path d="M1 1h2v2z"></path></symbol></svg>',
    )
  })

  it('rejects unsafe SVG payloads before generation', () => {
    expect(() =>
      validateIconfontSvg('<svg><symbol id="icon-demo"><script>alert(1)</script></symbol></svg>'),
    ).toThrow(/disallowed svg tag: script/)

    expect(() =>
      validateIconfontSvg(
        '<svg><symbol id="icon-demo"><path onload="alert(1)" d="M0 0"></path></symbol></svg>',
      ),
    ).toThrow(/disallowed svg attribute: onload/)

    expect(() =>
      validateIconfontSvg(
        '<svg><symbol id="icon-demo"><use href="javascript:alert(1)"></use></symbol></svg>',
      ),
    ).toThrow(/disallowed javascript url/)
  })

  it('generates a TSX sprite and metadata from vendor iconfont JavaScript', () => {
    const root = createTempRoot()
    const sourcePath = join(root, 'src/assets/iconfont/vendor/iconfont.js')
    const outputPath = join(root, 'src/assets/iconfont/generated/IconfontSprite.tsx')
    const metaPath = join(root, 'src/assets/iconfont/generated/iconfont-meta.json')
    mkdirSync(dirname(sourcePath), { recursive: true })
    writeFileSync(sourcePath, iconfontJs, { encoding: 'utf8', flag: 'w' })

    const result = generateIconfontSprite({
      sourcePath,
      outputPath,
      metaPath,
    })

    expect(result.changed).toBe(true)
    const output = readFileSync(outputPath, 'utf8')
    expect(output).toContain("name: 'IconfontSprite'")
    expect(output).toContain('<symbol id="icon-demo" viewBox="0 0 1024 1024">')
    expect(output).toContain(
      [
        '          <path',
        '            d="M0 0h10v10z"',
        '            fill="#fff"',
        '          ></path>',
      ].join('\n'),
    )
    expect(output).toContain('          <path d="M1 1h2v2z"></path>')
    expect(output).not.toContain('innerHTML')

    const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as Record<string, unknown>
    expect(meta).toEqual(
      expect.objectContaining({
        name: 'iconfont-sprite',
        hash: result.hash,
        symbolCount: 1,
        symbols: ['icon-demo'],
      }),
    )
  })

  it('reports drift in check mode without creating generated files', () => {
    const root = createTempRoot()
    const sourcePath = join(root, 'src/assets/iconfont/vendor/iconfont.js')
    const outputPath = join(root, 'src/assets/iconfont/generated/IconfontSprite.tsx')
    const metaPath = join(root, 'src/assets/iconfont/generated/iconfont-meta.json')
    mkdirSync(dirname(sourcePath), { recursive: true })
    writeFileSync(sourcePath, iconfontJs, { encoding: 'utf8', flag: 'w' })

    const result = generateIconfontSprite({
      sourcePath,
      outputPath,
      metaPath,
      check: true,
    })

    expect(result.drifted).toBe(true)
    expect(existsSync(outputPath)).toBe(false)
    expect(existsSync(metaPath)).toBe(false)
  })
})
