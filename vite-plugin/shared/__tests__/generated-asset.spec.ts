// @vitest-environment node

import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createGeneratedAsset, writeGeneratedAssetIfChanged } from '../generated-asset'

const tempRoots: string[] = []

const createTempRoot = () => {
  const root = mkdtempSync(join(tmpdir(), 'contract-generated-asset-'))
  tempRoots.push(root)
  return root
}

describe('generated asset helper', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('writes output and meta on first generation', () => {
    const root = createTempRoot()
    const outputPath = join(root, 'generated', 'asset.txt')
    const metaPath = join(root, 'generated', 'asset.meta.json')

    const result = writeGeneratedAssetIfChanged(
      createGeneratedAsset({
        name: 'test-asset',
        sourcePaths: ['source.ts'],
        outputPath,
        metaPath,
        content: 'generated content\n',
        hashInput: 'semantic content',
        metadata: { kind: 'unit-test' },
      }),
    )

    expect(result.changed).toBe(true)
    expect(result.hash).toMatch(/^sha256-[a-f0-9]{64}$/)
    expect(readFileSync(outputPath, 'utf8')).toBe('generated content\n')

    const metaText = readFileSync(metaPath, 'utf8')
    expect(metaText).toContain('"sources": ["source.ts"],')

    const meta = JSON.parse(metaText) as Record<string, unknown>
    expect(meta).toEqual(
      expect.objectContaining({
        name: 'test-asset',
        hash: result.hash,
        output: outputPath,
        sources: ['source.ts'],
        kind: 'unit-test',
      }),
    )
  })

  it('does not rewrite output when semantic hash and generated content are unchanged', () => {
    const root = createTempRoot()
    const outputPath = join(root, 'generated', 'asset.txt')
    const metaPath = join(root, 'generated', 'asset.meta.json')
    const asset = createGeneratedAsset({
      name: 'test-asset',
      sourcePaths: ['source.ts'],
      outputPath,
      metaPath,
      content: 'generated content\n',
      hashInput: 'semantic content',
    })

    writeGeneratedAssetIfChanged(asset)
    const before = statSync(outputPath).mtimeMs
    const result = writeGeneratedAssetIfChanged(asset)
    const after = statSync(outputPath).mtimeMs

    expect(result.changed).toBe(false)
    expect(after).toBe(before)
  })

  it('reports drift in check mode without writing files', () => {
    const root = createTempRoot()
    const outputPath = join(root, 'generated', 'asset.txt')
    const metaPath = join(root, 'generated', 'asset.meta.json')

    const result = writeGeneratedAssetIfChanged(
      createGeneratedAsset({
        name: 'test-asset',
        sourcePaths: ['source.ts'],
        outputPath,
        metaPath,
        content: 'generated content\n',
        hashInput: 'semantic content',
      }),
      { check: true },
    )

    expect(result.changed).toBe(true)
    expect(result.drifted).toBe(true)
    expect(existsSync(outputPath)).toBe(false)
    expect(existsSync(metaPath)).toBe(false)
  })
})
