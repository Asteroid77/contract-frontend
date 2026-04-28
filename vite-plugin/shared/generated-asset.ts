import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, relative } from 'node:path'

export type GeneratedAsset = {
  name: string
  sourcePaths: string[]
  outputPath: string
  metaPath: string
  content: string
  hashInput: string
  metadata?: Record<string, unknown>
}

export type GeneratedAssetOptions = {
  check?: boolean
}

export type GeneratedAssetResult = {
  changed: boolean
  drifted: boolean
  hash: string
}

export function createGeneratedAsset(asset: GeneratedAsset): GeneratedAsset {
  return asset
}

function createSha256Hash(input: string) {
  return `sha256-${createHash('sha256').update(input).digest('hex')}`
}

function readTextIfExists(path: string) {
  return existsSync(path) ? readFileSync(path, 'utf8') : null
}

function toPortablePath(path: string) {
  const relativePath = relative(process.cwd(), path)
  if (!relativePath.startsWith('..') && !isAbsolute(relativePath)) {
    return relativePath.replace(/\\/g, '/')
  }

  return path
}

function createMetaBody(asset: GeneratedAsset, hash: string) {
  return {
    name: asset.name,
    hash,
    sources: asset.sourcePaths.map(toPortablePath),
    output: toPortablePath(asset.outputPath),
    ...(asset.metadata ?? {}),
  }
}

function createMeta(asset: GeneratedAsset, hash: string) {
  return {
    ...createMetaBody(asset, hash),
    generatedAt: new Date().toISOString(),
  }
}

function formatJsonValue(value: unknown, indentLevel = 0): string {
  const indent = ' '.repeat(indentLevel)
  const nextIndent = ' '.repeat(indentLevel + 2)

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]'
    }

    if (value.length === 1 && (value[0] === null || typeof value[0] !== 'object')) {
      return `[${formatJsonValue(value[0])}]`
    }

    return `[\n${value
      .map((item) => `${nextIndent}${formatJsonValue(item, indentLevel + 2)}`)
      .join(',\n')}\n${indent}]`
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) {
      return '{}'
    }

    return `{\n${entries
      .map(
        ([key, entryValue]) =>
          `${nextIndent}${JSON.stringify(key)}: ${formatJsonValue(entryValue, indentLevel + 2)}`,
      )
      .join(',\n')}\n${indent}}`
  }

  return JSON.stringify(value) ?? 'null'
}

function stringifyGeneratedMeta(meta: Record<string, unknown>) {
  return `${formatJsonValue(meta)}\n`
}

function withoutGeneratedAt(metaText: string | null): Record<string, unknown> | null {
  if (!metaText) {
    return null
  }

  const { generatedAt: _generatedAt, ...rest } = JSON.parse(metaText) as Record<string, unknown>
  return rest
}

export function writeGeneratedAssetIfChanged(
  asset: GeneratedAsset,
  options: GeneratedAssetOptions = {},
): GeneratedAssetResult {
  const hash = createSha256Hash(asset.hashInput)
  const currentContent = readTextIfExists(asset.outputPath)
  const currentMetaText = readTextIfExists(asset.metaPath)
  const currentMetaBody = withoutGeneratedAt(currentMetaText)
  const nextMetaBody = createMetaBody(asset, hash)
  const changed =
    currentContent !== asset.content ||
    JSON.stringify(currentMetaBody) !== JSON.stringify(nextMetaBody)

  if (!changed) {
    return {
      changed: false,
      drifted: false,
      hash,
    }
  }

  if (options.check) {
    return {
      changed: true,
      drifted: true,
      hash,
    }
  }

  mkdirSync(dirname(asset.outputPath), { recursive: true })
  mkdirSync(dirname(asset.metaPath), { recursive: true })
  writeFileSync(asset.outputPath, asset.content, 'utf8')
  writeFileSync(asset.metaPath, stringifyGeneratedMeta(createMeta(asset, hash)), 'utf8')

  return {
    changed: true,
    drifted: false,
    hash,
  }
}
