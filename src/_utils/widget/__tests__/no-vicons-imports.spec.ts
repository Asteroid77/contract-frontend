// @vitest-environment node

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourceRoot = join(process.cwd(), 'src')
const sourceExtensions = new Set(['.ts', '.tsx', '.vue'])
const blockedPackagePrefix = `@${'vicons'}`

const getExtension = (path: string) => {
  const match = path.match(/\.[^.]+$/)
  return match?.[0] ?? ''
}

const collectSourceFiles = (directory: string): string[] => {
  const files: string[] = []

  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    const stat = statSync(path)

    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(path))
      continue
    }

    if (sourceExtensions.has(getExtension(path))) {
      files.push(path)
    }
  }

  return files
}

describe('icon dependencies', () => {
  it('does not import vicons directly from src files', () => {
    const filesWithVicons = collectSourceFiles(sourceRoot)
      .filter((path) => readFileSync(path, 'utf-8').includes(blockedPackagePrefix))
      .map((path) => relative(process.cwd(), path))

    expect(filesWithVicons).toEqual([])
  })
})
