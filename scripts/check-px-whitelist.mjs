#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

/**
 * check-px-whitelist.mjs —— px 硬编码白名单守卫脚本
 *
 * 【目的】
 * 项目使用设计契约（design-contract.yaml）统一管理允许出现的 px 值。
 * 本脚本在 CI 或本地 pre-commit 钩子中运行，扫描 git diff 中"新增的行"，
 * 检查其中是否包含不在白名单内的 px 值。
 * 如果发现违规的 px 用法，脚本以 exit(1) 退出，阻断提交或流水线。
 *
 * 【运行模式（mode）】
 * 脚本通过 parseArgs() 解析命令行参数，支持三种模式：
 *
 *   1. auto（默认）
 *      - 自动判断当前环境：如果工作区有未提交的改动，走 working-tree 逻辑；
 *        否则走 branch 逻辑。适合 pre-commit 钩子等场景。
 *
 *   2. working-tree
 *      - 只检查工作区中尚未提交的改动（即 `git diff` 的输出）。
 *      - 通过 hasWorkingTreeChanges() 判断是否存在改动。
 *
 *   3. branch
 *      - 检查当前分支相对于基准分支（base ref）的所有新增内容。
 *      - 流程：resolveBaseRef() 确定基准分支 → getMergeBase() 计算
 *        merge-base → 执行 `git diff mergeBase...HEAD`，拿到完整差异。
 *      - 适合 CI 流水线中对整个 PR/MR 的增量检查。
 *
 * 【关键函数说明】
 *
 *   parseArgs()
 *     解析 CLI 参数，提取 mode 和可选的 baseRef。
 *
 *   runGit(args, { allowFail })
 *     封装 spawnSync 执行 git 命令。
 *     - allowFail = false（默认）：命令失败时直接抛错终止脚本。
 *     - allowFail = true：用于"探测型"调用（例如检查某个 ref 是否存在），
 *       失败时不抛错，而是返回空字符串，由上层逻辑做 fallback 处理。
 *
 *   refExists(ref)
 *     检查给定的 git ref（分支名/标签/commit）是否存在。
 *
 *   pickExistingRef(...refs)
 *     从候选 ref 列表中选第一个存在的。用于兼容不同仓库的默认分支名
 *     （例如 main vs master）。
 *
 *   getTrackingRef()
 *     获取当前分支的远程追踪分支（upstream）。如果没有设置 upstream，
 *     返回 undefined，上层会 fallback 到默认分支。
 *
 *   resolveBaseRef(baseRefArg)
 *     确定用于 diff 比较的基准 ref。优先使用用户显式传入的 baseRefArg；
 *     否则依次尝试追踪分支、origin/main、origin/master 等常见默认值。
 *
 *   getMergeBase(baseRef)
 *     计算当前 HEAD 与基准 ref 的最近公共祖先（merge-base），
 *     确保只检查当前分支"自己新增"的改动，不误报基准分支已有的内容。
 *
 *   getDiffText(mode, baseRefArg)
 *     根据 mode 执行对应的 git diff 命令，返回统一格式的 diff 文本。
 *
 *   parsePxWhitelist()
 *     读取 docs/reference/api/design-contract.yaml，解析出两类白名单：
 *     - px whitelist：全局允许的 px 数值列表。
 *     - radius allowed_px：圆角等场景额外允许的 px 数值。
 *     这样开发者只要在设计契约里声明过的 px 值就不会被拦截。
 *
 *   parseAddedLines(diffText)
 *     解析 diff 文本，只提取以 "+" 开头的新增行（同时记录文件路径和行号），
 *     忽略删除行和上下文行——我们只关心"新写进去的代码"。
 *
 *   isAllowedPx(pxToken, line, whitelist)
 *     判断某个 px 值是否在白名单中。pxToken 是匹配到的数值字符串，
 *     line 是完整行内容（可能用于上下文判断，如区分 border-radius 等属性）。
 *
 *   main()
 *     入口函数，串联以上所有步骤：
 *     1. 解析参数，确定模式。
 *     2. 获取 diff 文本。
 *     3. 加载白名单。
 *     4. 解析新增行，逐行用 PX_PATTERN 正则匹配 px 值。
 *     5. 对每个匹配到的 px 值调用 isAllowedPx() 判断。
 *     6. 收集所有违规项并输出报告。
 *     7. 如有违规 → process.exit(1)，CI 流水线失败；全部通过 → exit(0)。
 *
 * 【扫描范围】
 * FILE_PATTERNS 限定只检查 *.ts / *.tsx / *.vue / *.css / *.scss 文件，
 * 避免对图片、配置文件等产生误报。
 *
 * 【CI 行为】
 * - 通过（exit 0）：diff 中新增行没有 px，或所有 px 值均在白名单内。
 * - 失败（exit 1）：存在不在白名单内的 px 硬编码，脚本会打印违规详情
 *   （文件、行号、具体 px 值），方便开发者快速定位并修复。
 */

const FILE_PATTERNS = ['*.ts', '*.tsx', '*.vue', '*.css', '*.scss']
const PX_PATTERN = /(\d+(?:\.\d+)?)px\b/g

const CONTRACT_PATH = resolve(process.cwd(), 'docs/reference/api/design-contract.yaml')

// 解析命令行参数，决定 diff 收集模式与基线。
const parseArgs = () => {
  // 读取命令行参数。该脚本只接受 --mode 和 --base-ref 两个可选参数。
  // 示例：
  // - node ... --mode=working-tree
  // - node ... --mode=branch --base-ref=origin/dev
  const args = process.argv.slice(2)
  const modeArg = args.find((arg) => arg.startsWith('--mode='))
  const baseArg = args.find((arg) => arg.startsWith('--base-ref='))

  const mode = modeArg ? modeArg.split('=')[1] : 'auto'
  const baseRef = baseArg ? baseArg.split('=')[1] : undefined

  // mode 只允许 3 种：
  // - auto: 自动判断（有本地变更走 working-tree，否则走 branch）
  // - working-tree: 仅比较本地暂存/未暂存变更
  // - branch: 比较当前分支与基线分支
  if (!['auto', 'working-tree', 'branch'].includes(mode)) {
    throw new Error(`Unsupported --mode value: ${mode}`)
  }

  return { mode, baseRef }
}

// 统一封装 git 命令；allowFail=true 时返回空输出而不抛错。
const runGit = (args, { allowFail = false } = {}) => {
  // 所有 git 调用都通过这里发起，保证：
  // 1) cwd 一致（仓库根目录）
  // 2) 输出编码一致（utf8）
  // 3) 错误策略一致（严格失败 vs 容错探测）
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
  })

  // 默认策略：失败即抛错。
  // allowFail=true 用于“探测性命令”（例如 upstream 可能不存在）。
  // 这类命令失败并不一定代表脚本无法继续，可以交给上层走 fallback。
  if (result.status !== 0 && !allowFail) {
    const stderr = result.stderr?.trim() || 'Unknown git error'
    throw new Error(stderr)
  }

  // 统一返回 stdout。若命令失败且 allowFail=true，stdout 通常为空字符串。
  // 上层通过空字符串/undefined 来判断“该候选不可用”。
  return (result.stdout || '').trimEnd()
}

// 判断当前仓库中某个 git 引用是否存在。
const refExists = (ref) =>
  // 这里不走 runGit，是因为我们只关心状态码，不关心 stdout/stderr 文本。
  // rev-parse --verify <ref> 成功表示 ref 在当前仓库可解析。
  spawnSync('git', ['rev-parse', '--verify', ref], {
    cwd: process.cwd(),
    encoding: 'utf8',
  }).status === 0

// 按传入顺序返回第一个存在的引用，保留优先级。
const pickExistingRef = (...refs) => {
  // 候选按顺序传入，函数按顺序命中；
  // 因此可通过“传参顺序”表达优先级策略。
  for (const ref of refs) {
    if (!ref) continue
    if (refExists(ref)) {
      return ref
    }
  }

  return undefined
}

// 检测是否存在已暂存或未暂存的本地改动。
const hasWorkingTreeChanges = () => {
  // 这里用 name-only 仅判断“是否有变更”，不用取完整 diff 文本，开销更低。
  // staged: 已 git add 的改动
  // unstaged: 工作区未 add 的改动
  const staged = runGit(['diff', '--cached', '--name-only'], { allowFail: true })
  const unstaged = runGit(['diff', '--name-only'], { allowFail: true })
  return Boolean(staged.trim() || unstaged.trim())
}

// 解析当前分支 upstream，作为可能的 diff 基线。
const getTrackingRef = () => {
  // @{upstream} 在以下情况常见不存在：
  // - 新建本地分支未设置 upstream
  // - CI 的 detached HEAD 场景
  // 因此这里使用 allowFail=true，把失败当“无 upstream”。
  const upstream = runGit(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'], {
    allowFail: true,
  })
  return upstream.trim() || undefined
}

// 按 参数/环境变量/upstream/fallback 的顺序解析可用基线引用。
const resolveBaseRef = (baseRefArg) => {
  // 在 PR/CI/本地开发多场景下，基线引用可能来源不同，
  // 因此采用“多来源优先级 + 存在性验证”的方式解析基线。
  const githubBaseRef = process.env.GITHUB_BASE_REF?.trim()
  const envBaseRef = process.env.PX_BASE_REF?.trim()

  // 第一优先级：显式输入（CLI/ENV）。
  const explicitCandidates = [baseRefArg]
  if (envBaseRef) {
    explicitCandidates.push(envBaseRef, `origin/${envBaseRef}`)
  }

  const explicitRef = pickExistingRef(...explicitCandidates)
  if (explicitRef) return explicitRef

  // 第二优先级：GitHub PR 环境给出的 base 分支。
  // 兼容直接给分支名（dev）与带远端前缀（origin/dev）的情况。
  const githubCandidates = []
  if (githubBaseRef) {
    githubCandidates.push(githubBaseRef, `origin/${githubBaseRef}`)
  }

  const githubRef = pickExistingRef(...githubCandidates)
  if (githubRef) return githubRef

  // 第三优先级：当前分支 upstream。
  const trackingRef = getTrackingRef()
  const trackedRef = pickExistingRef(trackingRef)
  if (trackedRef) return trackedRef

  // 第四优先级：远端默认分支符号引用（origin/HEAD -> origin/main/dev）。
  const originHead = runGit(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], {
    allowFail: true,
  })
  const originHeadRef = pickExistingRef(originHead.trim())
  if (originHeadRef) return originHeadRef

  // 第五优先级：硬编码兜底。
  // 这里把 dev 放在前面，贴合当前仓库主开发分支。
  const fallbackRefs = ['origin/dev', 'dev', 'origin/master', 'origin/main', 'master', 'main']
  const fallbackRef = pickExistingRef(...fallbackRefs)
  if (fallbackRef) return fallbackRef

  // 所有来源都失败时，输出“尝试过哪些 ref”帮助定位 CI 环境问题。
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

// 计算与基线的 merge-base，用于限定分支 diff 窗口。
const getMergeBase = (baseRef) => {
  // merge-base 失败的常见原因：
  // - checkout 深度太浅（没有完整提交历史）
  // - baseRef 指向的引用并不在当前仓库历史图中
  // 这里先 allowFail 取结果，再由业务层给出更具可操作性的错误信息。
  const mergeBase = runGit(['merge-base', 'HEAD', baseRef], { allowFail: true }).trim()
  if (!mergeBase) {
    throw new Error(
      `Unable to compute merge-base for HEAD and ${baseRef}. Ensure CI checkout fetches base branch history (e.g. fetch-depth: 0).`,
    )
  }
  return mergeBase
}

// 根据模式收集 diff 文本：工作区增量或分支与基线差异。
const getDiffText = (mode, baseRefArg) => {
  if (mode === 'working-tree') {
    // working-tree 模式只看“当前本地改动”，适合开发者本地自检。
    // --diff-filter=AM: 仅检查新增/修改文件，忽略删除文件。
    // --unified=0: 不携带上下文行，减少后续解析复杂度与文本体积。
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
    // 将暂存和未暂存 diff 拼接为统一输入，后续统一解析。
    return { diffText: `${unstaged}\n${staged}`, resolvedMode: 'working-tree', baseRef: null }
  }

  // branch / auto 都需要先解析基线并计算 merge-base。
  const baseRef = resolveBaseRef(baseRefArg)
  const mergeBase = getMergeBase(baseRef)
  // 分支比较窗口：mergeBase...HEAD（三点语法）。
  // 只拿“当前分支相对基线新增的改动”，避免把基线已有改动混进来。
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

  // auto 模式：
  // - 无本地改动时，用 branch 结果（更贴近 CI）
  // - 有本地改动时，切回 working-tree（更贴近开发者当前编辑状态）
  const useWorkingTree = hasWorkingTreeChanges()
  if (!useWorkingTree) {
    return { diffText: branchDiff, resolvedMode: 'branch', baseRef }
  }

  const workingTree = getDiffText('working-tree', baseRefArg)
  return { ...workingTree, resolvedMode: 'working-tree', baseRef }
}

// 从设计token读取并构建允许的 px 白名单集合。
const parsePxWhitelist = () => {
  // 这里直接解析 design-contract 原文（而非引入 YAML 解析器），
  // 目的是降低脚本依赖复杂度，保持 CI 守卫脚本轻量可执行。
  const content = readFileSync(CONTRACT_PATH, 'utf8')

  // 提取 px_whitelist 块和 radius.allowed_px。
  // 注意：这是面向当前文档结构的“约定式解析”，若token格式大改需同步更新正则。
  const pxWhitelistBlock = content.match(/px_whitelist:\n([\s\S]*?)\n[a-z_]+:/m)?.[1] ?? ''
  const radiusAllowedRaw = content.match(/radius:\n[\s\S]*?allowed_px:\s*\[([^\]]+)\]/m)?.[1] ?? ''

  const borderWidth = new Set()
  const breakpoints = new Set()
  const elevation = new Set()
  const radius = new Set()

  for (const rawLine of pxWhitelistBlock.split(/\r?\n/)) {
    // 只处理形如 "- key: value" 的配置行。
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

  // 1px 边框通常在设计系统中是基础允许项，这里做硬兜底避免误拦。
  borderWidth.add('1px')

  return { borderWidth, breakpoints, elevation, radius }
}

// 从 unified diff 中提取新增行，并保留文件与行号信息。
const parseAddedLines = (diffText) => {
  // 该函数实现了一个简化版 unified diff 解析器：
  // - 通过 "+++ b/..." 识别当前文件
  // - 通过 "@@" 识别新增段起始行号
  // - 只记录新增行（+），并维护准确行号
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
      // 新增行：记录后行号 +1
      violationsInput.push({ filePath, lineNumber: currentLine, content: line.slice(1) })
      currentLine += 1
      continue
    }

    if (line.startsWith('-') && !line.startsWith('---')) {
      // 删除行不推进“新增侧”行号。
      continue
    }

    if (line.startsWith(' ')) {
      // 上下文行会推进新增侧行号。
      currentLine += 1
    }
  }

  return violationsInput
}

// 结合白名单与语义关键词判断 px 是否允许。
const isAllowedPx = (pxToken, line, whitelist) => {
  // 判定策略不是“只看数值是否在白名单”，而是两层判断：
  // 1) 数值在某个白名单集合内
  // 2) 行文本出现对应语义关键词（border/media/shadow/radius）
  // 这样可以减少把“同样数值但错误用途”的场景误放行。
  const text = line.toLowerCase()

  if (whitelist.borderWidth.has(pxToken)) {
    if (/\bborder|\bstroke-width|\boutline|\bhairline|\bdivider/.test(text)) return true
    if (pxToken === '1px') return true
  }

  if (whitelist.breakpoints.has(pxToken)) {
    if (/@media|\bmax-width\b|\bmin-width\b|\bbreakpoint\b/.test(text)) return true
  }

  if (whitelist.elevation.has(pxToken)) {
    if (/box-shadow|shadow|drop-shadow|elevation/.test(text)) return true
  }

  if (whitelist.radius.has(pxToken)) {
    if (/radius|rounded|border-radius/.test(text)) return true
  }

  return false
}

// 主流程：收集 diff、扫描新增行 px、输出违规并以非零退出。
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
    // 一行可能出现多个 px（例如 box-shadow），全部提取并逐个判断。
    const pxMatches = [...line.content.matchAll(PX_PATTERN)].map((match) => `${match[1]}px`)
    if (pxMatches.length === 0) continue

    for (const pxToken of pxMatches) {
      if (isAllowedPx(pxToken, line.content, whitelist)) continue

      // 用 key 去重，避免同一行同一 px 被重复报告。
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
