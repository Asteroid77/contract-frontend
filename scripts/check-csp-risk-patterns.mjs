import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const require = createRequire(import.meta.url)

const ignoredDirectories = new Set(['.git', '.idea', '.vscode', 'coverage', 'node_modules'])

const scannableExtensions = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.mjs',
  '.ts',
  '.tsx',
  '.vue',
])

const riskPatterns = [
  {
    id: 'remote-cdn-unpkg',
    label: 'runtime remote CDN dependency',
    regex: /https?:\/\/unpkg\.com\b[^\s'"`<)]*/g,
  },
  {
    id: 'remote-cdn-jsdelivr',
    label: 'runtime remote CDN dependency',
    regex: /https?:\/\/cdn\.jsdelivr\.net\b[^\s'"`<)]*/g,
  },
  {
    id: 'remote-cdn-cdnjs',
    label: 'runtime remote CDN dependency',
    regex: /https?:\/\/cdnjs\.cloudflare\.com\b[^\s'"`<)]*/g,
  },
  {
    id: 'remote-cdn-esm-sh',
    label: 'runtime remote CDN dependency',
    regex: /https?:\/\/esm\.sh\b[^\s'"`<)]*/g,
  },
  {
    id: 'remote-cdn-skypack',
    label: 'runtime remote CDN dependency',
    regex: /https?:\/\/cdn\.skypack\.dev\b[^\s'"`<)]*/g,
  },
  {
    id: 'remote-cdn-jspm',
    label: 'runtime remote CDN dependency',
    regex: /https?:\/\/ga\.jspm\.io\b[^\s'"`<)]*/g,
  },
  {
    id: 'unsafe-new-function',
    label: 'unsafe dynamic code execution',
    regex: /\bnew\s+Function\b/g,
  },
  {
    id: 'unsafe-eval',
    label: 'unsafe dynamic code execution',
    regex: /\beval\s*\(/g,
  },
  {
    id: 'unsafe-string-set-timeout',
    label: 'unsafe string timer execution',
    regex: /\bsetTimeout\s*\(\s*(['"`])/g,
  },
  {
    id: 'unsafe-string-set-interval',
    label: 'unsafe string timer execution',
    regex: /\bsetInterval\s*\(\s*(['"`])/g,
  },
  {
    id: 'unsafe-inner-html',
    label: 'unsafe HTML injection sink',
    regex: /\.innerHTML\s*=/g,
  },
  {
    id: 'unsafe-outer-html',
    label: 'unsafe HTML injection sink',
    regex: /\.outerHTML\s*=/g,
  },
  {
    id: 'unsafe-insert-adjacent-html',
    label: 'unsafe HTML injection sink',
    regex: /\.insertAdjacentHTML\s*\(/g,
  },
  {
    id: 'unsafe-document-write',
    label: 'unsafe HTML injection sink',
    regex: /\bdocument\.write\s*\(/g,
  },
  {
    id: 'unsafe-domparser-parse-from-string',
    label: 'unsafe HTML parser sink',
    regex: /\b(?:new\s+)?DOMParser\s*\(\s*\)\.parseFromString\s*\(/g,
  },
  {
    id: 'unsafe-create-contextual-fragment',
    label: 'unsafe DOM fragment sink',
    regex: /\.createContextualFragment\s*\(/g,
  },
  {
    id: 'unsafe-trusted-types-create-policy',
    label: 'unreviewed Trusted Types policy creation',
    regex: /\btrustedTypes\.createPolicy\s*\(/g,
  },
  {
    id: 'unsafe-v-html',
    label: 'unsafe Vue HTML binding',
    regex: /\bv-html\s*=/g,
  },
]

const allowlistedPathSuffixes = [
  'src/assets/iconfont/vendor/iconfont.js',
  'vite-plugin/__tests__/IconfontSpriteVitePlugin.spec.ts',
  'src/modules/approval/presentation/print/__tests__/printUtils.spec.ts',
  'src/modules/shared/application/security/trusted-types.ts',
]

const fileExtension = (path) => {
  const index = path.lastIndexOf('.')
  return index === -1 ? '' : path.slice(index)
}

const isScannableFile = (path) => scannableExtensions.has(fileExtension(path))

const walkFiles = (targetPath, files = []) => {
  if (!existsSync(targetPath)) {
    throw new Error(`scan target does not exist: ${targetPath}`)
  }

  const stats = statSync(targetPath)
  if (stats.isFile()) {
    if (isScannableFile(targetPath)) {
      files.push(targetPath)
    }
    return files
  }

  if (!stats.isDirectory()) {
    return files
  }

  for (const entry of readdirSync(targetPath, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue
    }

    walkFiles(resolve(targetPath, entry.name), files)
  }

  return files
}

const locateLineColumn = (content, index) => {
  let line = 1
  let lineStart = 0

  for (let cursor = 0; cursor < index; cursor += 1) {
    if (content.charCodeAt(cursor) === 10) {
      line += 1
      lineStart = cursor + 1
    }
  }

  return {
    line,
    column: index - lineStart + 1,
  }
}

const isAllowlistedPath = (file) =>
  allowlistedPathSuffixes.some(
    (suffix) => file === suffix || file.endsWith(`/${suffix}`) || file.endsWith(`\\${suffix}`),
  )

const scanFile = ({ root, filePath }) => {
  const content = readFileSync(filePath, 'utf8')
  const findings = []
  const relativeFilePath = relative(root, filePath)

  if (isAllowlistedPath(relativeFilePath)) {
    return findings
  }

  for (const pattern of riskPatterns) {
    pattern.regex.lastIndex = 0
    for (const match of content.matchAll(pattern.regex)) {
      const matchIndex = match.index ?? 0
      const location = locateLineColumn(content, matchIndex)

      findings.push({
        file: relativeFilePath,
        line: location.line,
        column: location.column,
        patternId: pattern.id,
        label: pattern.label,
        match: match[0],
      })
    }
  }

  findings.sort((left, right) => left.line - right.line || left.column - right.column)
  return findings
}

export const collectCspRiskFindings = ({ root = repoRoot, targets }) => {
  const resolvedTargets = targets.map((target) => resolve(root, target))
  return resolvedTargets.flatMap((target) =>
    walkFiles(target).flatMap((filePath) => scanFile({ root, filePath })),
  )
}

export const formatCspRiskFindings = (findings) => {
  if (findings.length === 0) {
    return 'csp-risk-patterns: ok\n'
  }

  return [
    `csp-risk-patterns: found ${findings.length} potential CSP risk pattern(s)`,
    ...findings.map(
      (finding) =>
        `${finding.file}:${finding.line}:${finding.column} ${finding.patternId} (${finding.label}) ${finding.match}`,
    ),
    '',
  ].join('\n')
}

export const shouldFailForMode = ({ mode, findingsCount }) => mode === 'src' && findingsCount > 0

const resolvePackageTarget = (packageName) => {
  try {
    return dirname(require.resolve(`${packageName}/package.json`))
  } catch {
    return dirname(require.resolve(packageName))
  }
}

const parseArgs = (argv) => {
  const packageMode = argv.includes('--package')
  const nonFlagArgs = argv.filter((arg) => !arg.startsWith('--'))

  if (packageMode) {
    if (nonFlagArgs.length !== 1) {
      throw new Error('usage: check-csp-risk-patterns.mjs --package <package-name>')
    }

    return {
      mode: 'package',
      root: repoRoot,
      targets: [resolvePackageTarget(nonFlagArgs[0])],
    }
  }

  const targets = nonFlagArgs.length > 0 ? nonFlagArgs : ['src']
  const mode = targets.length === 1 && targets[0] === 'dist' ? 'dist' : 'src'

  return {
    mode,
    root: repoRoot,
    targets,
  }
}

export const runCspRiskPatternCheck = ({ argv = process.argv.slice(2) } = {}) => {
  const options = parseArgs(argv)
  const findings = collectCspRiskFindings(options)
  process.stdout.write(formatCspRiskFindings(findings))

  return shouldFailForMode({ mode: options.mode, findingsCount: findings.length }) ? 1 : 0
}

const isMainModule = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMainModule) {
  try {
    process.exitCode = runCspRiskPatternCheck()
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 2
  }
}
