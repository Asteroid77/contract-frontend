#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const FILE_PATTERNS = ['*.ts', '*.tsx', '*.vue', '*.css', '*.scss']
const PX_PATTERN = /(\d+(?:\.\d+)?)px\b/g

const CONTRACT_PATH = resolve(process.cwd(), 'docs/design-contract.yaml')

const parseArgs = () => {
  const args = process.argv.slice(2)
  const modeArg = args.find((arg) => arg.startsWith('--mode='))
  const baseArg = args.find((arg) => arg.startsWith('--base-ref='))

  const mode = modeArg ? modeArg.split('=')[1] : 'auto'
  const baseRef = baseArg ? baseArg.split('=')[1] : undefined

  if (!['auto', 'working-tree', 'branch'].includes(mode)) {
    throw new Error(`Unsupported --mode value: ${mode}`)
  }

  return { mode, baseRef }
}

const runGit = (args, { allowFail = false } = {}) => {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
  })

  if (result.status !== 0 && !allowFail) {
    const stderr = result.stderr?.trim() || 'Unknown git error'
    throw new Error(stderr)
  }

  return (result.stdout || '').trimEnd()
}

const refExists = (ref) =>
  spawnSync('git', ['rev-parse', '--verify', ref], {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).status === 0

const pickExistingRef = (...refs) => {
  for (const ref of refs) {
    if (!ref) continue
    if (refExists(ref)) {
      return ref
    }
  }

  return undefined
}

const hasWorkingTreeChanges = () => {
  const staged = runGit(['diff', '--cached', '--name-only'], { allowFail: true })
  const unstaged = runGit(['diff', '--name-only'], { allowFail: true })
  return Boolean(staged.trim() || unstaged.trim())
}

const getTrackingRef = () => {
  const upstream = runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'], {
    allowFail: true,
  })
  return upstream.trim() || undefined
}

const resolveBaseRef = (baseRefArg) => {
  const githubBaseRef = process.env.GITHUB_BASE_REF?.trim()
  const envBaseRef = process.env.PX_BASE_REF?.trim()

  const explicitCandidates = [baseRefArg]
  if (envBaseRef) {
    explicitCandidates.push(envBaseRef, `origin/${envBaseRef}`)
  }

  const explicitRef = pickExistingRef(...explicitCandidates)
  if (explicitRef) return explicitRef

  const githubCandidates = []
  if (githubBaseRef) {
    githubCandidates.push(githubBaseRef, `origin/${githubBaseRef}`)
  }

  const githubRef = pickExistingRef(...githubCandidates)
  if (githubRef) return githubRef

  const trackingRef = getTrackingRef()
  const trackedRef = pickExistingRef(trackingRef)
  if (trackedRef) return trackedRef

  const originHead = runGit(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], {
    allowFail: true,
  })
  const originHeadRef = pickExistingRef(originHead.trim())
  if (originHeadRef) return originHeadRef

  const fallbackRefs = ['origin/dev', 'dev', 'origin/master', 'origin/main', 'master', 'main']
  const fallbackRef = pickExistingRef(...fallbackRefs)
  if (fallbackRef) return fallbackRef

  const attemptedRefs = [
    baseRefArg,
    envBaseRef,
    envBaseRef ? `origin/${envBaseRef}` : undefined,
    githubBaseRef,
    githubBaseRef ? `origin/${githubBaseRef}` : undefined,
    trackingRef,
    originHead.trim(),
    ...fallbackRefs,
  ]
    .filter(Boolean)
    .join(', ')

  throw new Error(
    `Unable to resolve a base reference for branch diff mode. Tried: ${attemptedRefs || 'none'}`,
  )
}

const getMergeBase = (baseRef) => {
  const mergeBase = runGit(['merge-base', 'HEAD', baseRef], { allowFail: true }).trim()
  if (!mergeBase) {
    throw new Error(
      `Unable to compute merge-base for HEAD and ${baseRef}. Ensure CI checkout fetches base branch history (e.g. fetch-depth: 0).`,
    )
  }
  return mergeBase
}

const getDiffText = (mode, baseRefArg) => {
  if (mode === 'working-tree') {
    const unstaged = runGit([
      'diff',
      '--no-color',
      '--unified=0',
      '--diff-filter=AM',
      '--',
      ...FILE_PATTERNS,
    ])
    const staged = runGit([
      'diff',
      '--cached',
      '--no-color',
      '--unified=0',
      '--diff-filter=AM',
      '--',
      ...FILE_PATTERNS,
    ])
    return { diffText: `${unstaged}\n${staged}`, resolvedMode: 'working-tree', baseRef: null }
  }

  const baseRef = resolveBaseRef(baseRefArg)
  const mergeBase = getMergeBase(baseRef)
  const branchDiff = runGit([
    'diff',
    '--no-color',
    '--unified=0',
    '--diff-filter=AM',
    `${mergeBase}...HEAD`,
    '--',
    ...FILE_PATTERNS,
  ])

  if (mode === 'branch') {
    return { diffText: branchDiff, resolvedMode: 'branch', baseRef }
  }

  const useWorkingTree = hasWorkingTreeChanges()
  if (!useWorkingTree) {
    return { diffText: branchDiff, resolvedMode: 'branch', baseRef }
  }

  const workingTree = getDiffText('working-tree', baseRefArg)
  return { ...workingTree, resolvedMode: 'working-tree', baseRef }
}

const parsePxWhitelist = () => {
  const content = readFileSync(CONTRACT_PATH, 'utf8')

  const pxWhitelistBlock = content.match(/px_whitelist:\n([\s\S]*?)\n[a-z_]+:/m)?.[1] ?? ''
  const radiusAllowedRaw = content.match(/radius:\n[\s\S]*?allowed_px:\s*\[([^\]]+)\]/m)?.[1] ?? ''

  const borderWidth = new Set()
  const breakpoints = new Set()
  const elevation = new Set()
  const radius = new Set()

  for (const rawLine of pxWhitelistBlock.split(/\r?\n/)) {
    const line = rawLine.trim()
    const entry = line.match(/^-\s*([a-zA-Z0-9_-]+):\s*(.+)$/)
    if (!entry) continue
    const [, key, value] = entry
    const pxValues = value.match(/\d+(?:\.\d+)?px/g) ?? []

    if (key === 'border-width') {
      pxValues.forEach((token) => borderWidth.add(token))
    }
    if (key === 'breakpoints') {
      pxValues.forEach((token) => breakpoints.add(token))
    }
    if (key === 'elevation_internal') {
      pxValues.forEach((token) => elevation.add(token))
    }
  }

  ;(radiusAllowedRaw.match(/\d+(?:\.\d+)?/g) ?? []).forEach((num) => {
    radius.add(`${num}px`)
  })

  // 1px borders are already allowed, but keep it as a hard fallback.
  borderWidth.add('1px')

  return { borderWidth, breakpoints, elevation, radius }
}

const parseAddedLines = (diffText) => {
  const violationsInput = []
  const lines = diffText.split(/\r?\n/)
  let filePath = ''
  let currentLine = 0

  for (const line of lines) {
    if (line.startsWith('+++ b/')) {
      filePath = line.slice('+++ b/'.length)
      continue
    }

    if (line.startsWith('@@')) {
      const match = line.match(/\+(\d+)(?:,\d+)?/)
      currentLine = match ? Number(match[1]) : 0
      continue
    }

    if (!filePath || currentLine === 0) continue

    if (line.startsWith('+') && !line.startsWith('+++')) {
      violationsInput.push({ filePath, lineNumber: currentLine, content: line.slice(1) })
      currentLine += 1
      continue
    }

    if (line.startsWith('-') && !line.startsWith('---')) {
      continue
    }

    if (line.startsWith(' ')) {
      currentLine += 1
    }
  }

  return violationsInput
}

const isAllowedPx = (pxToken, line, whitelist) => {
  const text = line.toLowerCase()

  if (whitelist.borderWidth.has(pxToken)) {
    if (/\bborder|\bstroke-width|\boutline|\bhairline|\bdivider/.test(text)) return true
    if (pxToken === '1px') return true
  }

  if (whitelist.breakpoints.has(pxToken)) {
    if (/\@media|\bmax-width\b|\bmin-width\b|\bbreakpoint\b/.test(text)) return true
  }

  if (whitelist.elevation.has(pxToken)) {
    if (/box-shadow|shadow|drop-shadow|elevation/.test(text)) return true
  }

  if (whitelist.radius.has(pxToken)) {
    if (/radius|rounded|border-radius/.test(text)) return true
  }

  return false
}

const main = () => {
  const { mode, baseRef } = parseArgs()
  const { diffText, resolvedMode, baseRef: resolvedBaseRef } = getDiffText(mode, baseRef)
  const whitelist = parsePxWhitelist()
  const addedLines = parseAddedLines(diffText)

  if (addedLines.length === 0) {
    console.log(`check:px passed (mode=${resolvedMode}, no added source lines to scan)`)
    return
  }

  const violations = []
  const dedupe = new Set()

  for (const line of addedLines) {
    const pxMatches = [...line.content.matchAll(PX_PATTERN)].map((match) => `${match[1]}px`)
    if (pxMatches.length === 0) continue

    for (const pxToken of pxMatches) {
      if (isAllowedPx(pxToken, line.content, whitelist)) continue

      const key = `${line.filePath}:${line.lineNumber}:${pxToken}:${line.content}`
      if (dedupe.has(key)) continue
      dedupe.add(key)

      violations.push({
        filePath: line.filePath,
        lineNumber: line.lineNumber,
        pxToken,
        content: line.content,
      })
    }
  }

  if (violations.length > 0) {
    const modeHint =
      resolvedMode === 'branch'
        ? `mode=branch base=${resolvedBaseRef ?? 'unknown'}`
        : 'mode=working-tree'

    console.error(`check:px failed (${modeHint})`)
    console.error('Found disallowed hardcoded px values in added lines:')

    for (const violation of violations) {
      console.error(
        `- ${violation.filePath}:${violation.lineNumber} [${violation.pxToken}] ${violation.content.trim()}`,
      )
    }

    process.exit(1)
  }

  const modeHint =
    resolvedMode === 'branch'
      ? `mode=branch base=${resolvedBaseRef ?? 'unknown'}`
      : 'mode=working-tree'
  console.log(`check:px passed (${modeHint}, scanned ${addedLines.length} added lines)`)
}

main()
