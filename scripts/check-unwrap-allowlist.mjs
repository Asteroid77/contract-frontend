#!/usr/bin/env node

import { spawnSync } from 'node:child_process'

/**
 * check-unwrap-allowlist.mjs —— unWrap 调用守卫脚本
 *
 * 【目的】
 * 项目中 `unWrap`（或类似的解包/断言函数）具有运行时风险——
 * 如果值为 null/undefined 会直接抛异常。因此我们希望严格控制它的使用范围：
 * 只有白名单（ALLOWED_FILES）中列出的文件才允许调用 unWrap，
 * 其他任何文件出现 unWrap 调用都视为违规，CI 将阻断。
 *
 * 【白名单机制】
 * ALLOWED_FILES 是一个 Set，列出了允许使用 unWrap 的文件路径。
 * 目前只有本脚本自身被允许（因为脚本内部需要引用 unWrap 字符串做搜索）。
 * 如果某个文件确实需要使用 unWrap，必须先把它加入 ALLOWED_FILES，
 * 经过代码评审后合入。
 *
 * 【搜索策略与双引擎回退】
 *
 *   searchUnWrapUsage() 执行实际搜索，采用双引擎策略：
 *
 *   第一优先：ripgrep（rg）
 *     - 速度快，支持 glob 过滤，是首选搜索工具。
 *     - 使用 SEARCH_GLOBS 指定的文件模式（*.ts, *.tsx, *.vue, *.js, *.mjs, *.cjs）
 *       进行搜索，避免扫描 node_modules、图片等无关文件。
 *     - 如果系统上没有安装 rg（spawnSync 返回 ENOENT 错误），
 *       脚本不会直接失败，而是自动回退到 git grep。
 *
 *   回退方案：git grep
 *     - 任何 git 仓库都自带，不需要额外安装。
 *     - 使用 GIT_GREP_PATHS（由 SEARCH_GLOBS 转换为 git pathspec 格式，
 *       例如 ":(glob)**.ts" 这类 glob 语法）来限定搜索范围。
 *
 * 【搜索结果状态码含义】
 *   - status = 0：搜索命中了内容（找到了 unWrap 调用）。
 *   - status = 1：搜索未命中任何内容——这在本场景下是"通过"的意思，
 *     说明代码库中没有 unWrap 调用，完全合规。
 *   - status >= 2 或其他异常：搜索工具自身出错，脚本应报错退出。
 *
 * 【parseRipgrepLine(line)】
 *   解析 rg 或 git grep 的输出行，提取文件路径。
 *   输出格式通常为 "文件路径:行号:匹配内容"，该函数取出文件路径部分，
 *   用于后续与白名单比对。
 *
 * 【run() 主流程】
 *   1. 调用 searchUnWrapUsage() 获取所有命中 unWrap 的文件列表。
 *   2. 如果没有命中 → 直接通过（exit 0）。
 *   3. 如果有命中 → 逐个检查是否在 ALLOWED_FILES 白名单中：
 *      - 全部在白名单内 → 通过（exit 0）。
 *      - 存在不在白名单内的文件 → 打印违规文件列表，exit(1) 阻断 CI。
 *
 * 【CI 行为】
 * - 通过（exit 0）：代码库中无 unWrap 调用，或所有调用均在白名单文件内。
 * - 失败（exit 1）：发现白名单之外的文件使用了 unWrap，
 *   脚本输出违规文件路径，开发者需要移除调用或将文件加入白名单后重试。
 */

const ALLOWED_FILES = new Set(['scripts/check-unwrap-allowlist.mjs'])
const SEARCH_GLOBS = ['**/*.ts', '**/*.tsx', '**/*.vue', '**/*.js', '**/*.mjs', '**/*.cjs']
// git grep 使用 pathspec 语法时，需要显式声明 glob 模式。
const GIT_GREP_PATHS = SEARCH_GLOBS.map((glob) => `:(glob)${glob}`)

const parseRipgrepLine = (line) => {
  // 解析 "file:line:content" 结构。
  // 这里手动找前两个冒号，避免 content 内再出现冒号导致误拆分。
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
  // 优先使用 rg：更快、输出稳定，适合 CI 大仓库扫描。
  // 仅扫描源码类型文件，避免把 workflow/文档中的示例文本当成违规。
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

  // 仅当“系统没有 rg”（ENOENT）时才回退 git grep；
  // 其他错误（参数错误/权限问题）应直接暴露，不做吞错。
  if (ripgrepResult.error.code !== 'ENOENT') {
    throw ripgrepResult.error
  }

  // 回退到 git grep，保证在最小环境也可运行。
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
  // 主流程：先搜，再解析，再做白名单过滤，最后决定退出码。
  const result = searchUnWrapUsage()

  if (result.error) {
    throw result.error
  }

  // 约定：搜索类命令 status=1 表示“没找到匹配”，这是成功场景。
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

  // 白名单外命中即视为违规，阻断 CI。
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
