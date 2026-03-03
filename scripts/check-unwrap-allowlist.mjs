#!/usr/bin/env node

import { spawnSync } from 'node:child_process'

const ALLOWED_FILES = new Set(['scripts/check-unwrap-allowlist.mjs'])
const SEARCH_GLOBS = ['**/*.ts', '**/*.tsx', '**/*.vue', '**/*.js', '**/*.mjs', '**/*.cjs']
const GIT_GREP_PATHS = SEARCH_GLOBS.map((glob) => `:(glob)${glob}`)

const parseRipgrepLine = (line) => {
  const firstColon = line.indexOf(':')
  const secondColon = line.indexOf(':', firstColon + 1)

  if (firstColon === -1 || secondColon === -1) {
    return null
  }

  const filePath = line.slice(0, firstColon).replace(/^\.\//, '').replace(/\\/g, '/')
  const lineNumber = Number(line.slice(firstColon + 1, secondColon))
  const content = line.slice(secondColon + 1)

  if (!filePath || Number.isNaN(lineNumber)) {
    return null
  }

  return { filePath, lineNumber, content }
}

const searchUnWrapUsage = () => {
  const ripgrepArgs = [
    '--line-number',
    '--no-heading',
    '--color',
    'never',
    '--fixed-strings',
    'unWrap',
    ...SEARCH_GLOBS.flatMap((glob) => ['--glob', glob]),
    '.',
  ]

  const ripgrepResult = spawnSync('rg', ripgrepArgs, {
    cwd: process.cwd(),
    encoding: 'utf8',
  })

  if (!ripgrepResult.error) {
    return ripgrepResult
  }

  if (ripgrepResult.error.code !== 'ENOENT') {
    throw ripgrepResult.error
  }

  return spawnSync(
    'git',
    ['grep', '-n', '--fixed-strings', '-e', 'unWrap', '--', ...GIT_GREP_PATHS],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
    },
  )
}

const run = () => {
  const result = searchUnWrapUsage()

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0 && result.status !== 1) {
    const stderr = result.stderr?.trim() || 'Unknown ripgrep error'
    throw new Error(stderr)
  }

  if (result.status === 1 || !result.stdout.trim()) {
    console.log('check:unwrap passed (no unWrap usage found)')
    return
  }

  const matches = result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseRipgrepLine)
    .filter((value) => value !== null)

  const violations = matches.filter((entry) => !ALLOWED_FILES.has(entry.filePath))

  if (violations.length > 0) {
    console.error('check:unwrap failed. Found unWrap usage outside allowlist:')
    for (const violation of violations) {
      console.error(`- ${violation.filePath}:${violation.lineNumber} ${violation.content.trim()}`)
    }

    process.exit(1)
  }

  console.log(`check:unwrap passed (allowed matches: ${matches.length})`)
}

run()
