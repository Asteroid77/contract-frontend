import { readdirSync, statSync, readFileSync } from 'node:fs'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testDir = dirname(fileURLToPath(import.meta.url))
const presentationDir = resolve(testDir, '..')
const sourceRoots = [resolve(testDir, '../../..'), resolve(testDir, '../../../../views')]

const collectFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) {
      return collectFiles(fullPath)
    }

    return [fullPath]
  })

describe('work-order presentation TSX boundary', () => {
  it('keeps work-order presentation components out of Vue SFC files', () => {
    const vueFiles = collectFiles(presentationDir)
      .filter((file) => extname(file) === '.vue')
      .map((file) => relative(presentationDir, file))

    expect(vueFiles).toEqual([])
  })

  it('does not import work-order presentation components through .vue paths', () => {
    const sourceFiles = sourceRoots.flatMap((root) =>
      collectFiles(root).filter((file) => /\.(?:ts|tsx|vue)$/.test(file)),
    )

    const vuePresentationImports = sourceFiles
      .flatMap((file) => {
        const content = readFileSync(file, 'utf8')
        const hasWorkOrderVueImport =
          /from\s+['"]@\/modules\/work-order\/presentation\/[^'"]+\.vue['"]/.test(content) ||
          /from\s+['"]\.\/WorkOrder[^'"]+\.vue['"]/.test(content)

        return hasWorkOrderVueImport ? [relative(resolve(testDir, '../../../..'), file)] : []
      })
      .sort()

    expect(vuePresentationImports).toEqual([])
  })

  it('keeps detail page shell padding on both axes', () => {
    const css = readFileSync(join(presentationDir, 'styles/WorkOrderDetailPage.css'), 'utf8')
    const baseRule = css.match(/\.work-order-detail-page\s*{(?<body>[^}]*)}/)?.groups?.body ?? ''
    const mediaRule = css.split('@media').at(1) ?? ''

    expect(baseRule).toContain('box-sizing: border-box;')
    expect(baseRule).toContain('padding-block: var(--spacing-md);')
    expect(baseRule).toContain('padding-inline: var(--spacing-md);')

    expect(mediaRule).toContain('padding-block: var(--spacing-lg);')
    expect(mediaRule).toContain('padding-inline: var(--spacing-lg);')
  })
})
