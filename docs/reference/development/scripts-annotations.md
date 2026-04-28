Status: active
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# scripts 注解文档

本文档按“执行入口 -> 关键函数 -> 关键判断 -> 输出/退出码 -> 失败排查”整理 `scripts/` 目录中的 3 个脚本，面向需要读懂 CI 脚本行为的开发者。

---

## 1) `scripts/check-px-whitelist.mjs`

### 作用

该脚本用于检查 **增量改动**（不是全量仓库）中的新增行，是否出现不被设计契约允许的硬编码 `px`。如果有违规项，脚本返回非零退出码，阻断 CI。

### 输入

- CLI 参数
  - `--mode=auto|working-tree|branch`
  - `--base-ref=<ref>`
- 环境变量
  - `GITHUB_BASE_REF`
  - `PX_BASE_REF`
- 契约文件
  - `docs/reference/api/design-contract.yaml`

### 执行顺序（入口到结束）

1. `main()` 启动。
2. `parseArgs()` 解析模式和可选基线分支。
3. `getDiffText(mode, baseRef)` 采集 diff：
   - `working-tree`：采集暂存 + 未暂存差异。
   - `branch`：对比 `mergeBase...HEAD`。
   - `auto`：有本地改动则走 working-tree，否则走 branch。
4. `parsePxWhitelist()` 从设计契约提取允许的 `px` 白名单（边框、断点、阴影、圆角）。
5. `parseAddedLines(diffText)` 从 unified diff 里提取新增行，并记录文件与行号。
6. 遍历新增行：
   - 用正则匹配所有 `px`。
   - `isAllowedPx()` 进行“白名单 + 语义关键词”双重判定。
7. 若存在违规项：打印 `文件:行号 [px值] 内容` 并 `process.exit(1)`；否则打印通过信息。

### 关键函数注解

- `runGit(args, { allowFail })`
  - 统一发起 git 命令。
  - 默认严格失败（抛错）。
  - `allowFail=true` 时不抛错，返回空输出，供上层走 fallback。

- `resolveBaseRef(baseRefArg)`
  - 逐级解析分支基线：
    1. CLI/`PX_BASE_REF`
    2. `GITHUB_BASE_REF`
    3. upstream
    4. `origin/dev`, `dev`
    5. `origin/HEAD`
    6. `origin/master`, `origin/main`, `master`, `main`
  - 全部失败时抛错并输出尝试过的 ref 列表。

- `getMergeBase(baseRef)`
  - 计算 `HEAD` 与基线的 merge-base。
  - 常见失败原因：浅克隆导致历史不足（CI `fetch-depth` 太小）。

- `parseAddedLines(diffText)`
  - 解析 unified diff：
    - `+++ b/...` 切换当前文件。
    - `@@` 读取新增段起始行号。
    - `+` 行计入检查集。
    - `-` 行不推进新增侧行号。
    - 空格上下文行推进新增侧行号。

- `isAllowedPx(pxToken, line, whitelist)`
  - 先看数值是否在白名单集合。
  - 再看该行是否满足语义关键词（例如 border/media/shadow/radius）。
  - 这是为了避免“数值正确但语义错误”被误放行。

### 成功/失败条件

- 成功：无违规项，退出码 `0`。
- 失败：存在违规项或无法解析有效基线，退出码 `1`。

### CI 常见调用

```bash
node scripts/check-px-whitelist.mjs --mode=branch
```

### 失败排查

- 报 `Unable to resolve a base reference`：检查 PR 环境中的 `GITHUB_BASE_REF` 与远端引用可用性。
- 报 `Unable to compute merge-base`：检查 checkout 深度，建议 `fetch-depth: 0`。
- 误报某个 px：检查设计契约白名单和该行语义关键词是否匹配。

---

## 2) `scripts/check-unwrap-allowlist.mjs`

### 作用

该脚本用于限制 `unWrap` 的使用范围：只有白名单文件允许出现 `unWrap`。若白名单外命中，则 CI 失败。

### 输入

- 内置白名单：`ALLOWED_FILES`
- 搜索范围：`SEARCH_GLOBS`（`ts/tsx/vue/js/mjs/cjs`）

### 执行顺序（入口到结束）

1. `run()` 启动。
2. `searchUnWrapUsage()` 搜索命中：
   - 优先 `rg`。
   - 若系统没有 `rg`（ENOENT），回退 `git grep`。
3. 若状态码是 `1` 或空输出，视为“未命中”，直接通过。
4. `parseRipgrepLine()` 解析 `file:line:content`。
5. 过滤白名单外命中项。
6. 有违规则打印详情并 `process.exit(1)`，否则通过。

### 关键函数注解

- `searchUnWrapUsage()`
  - `rg` 更快，适合 CI。
  - 仅在 `rg` 缺失时回退，不吞掉其它类型错误。
  - 仅扫描源码文件，避免将 workflow/文档中的文本误报为违规。

- `parseRipgrepLine(line)`
  - 通过前两个冒号拆分，保留后续内容原样，避免内容中冒号造成误拆。

### 成功/失败条件

- 成功：
  - 没有 `unWrap` 命中；或
  - 命中全部位于白名单文件。
- 失败：白名单外命中任意一条。

### CI 常见调用

```bash
node scripts/check-unwrap-allowlist.mjs
```

### 失败排查

- 报白名单外命中：根据输出文件路径决定是否改代码或扩白名单。
- 报搜索工具错误：检查 runner 是否安装 `rg`，或让脚本回退 `git grep`。

---

## 3) `scripts/upload-sourcemaps.mjs`

### 作用

该脚本在构建后上传 `dist/assets` 下的 `.map` 文件到 sourcemap 服务，支持线上错误堆栈还原。

### 输入

- 环境变量
  - `DIST_DIR`（默认 `../dist/assets`）
  - `SOURCEMAP_RESOLVER_ENDPOINT`（默认 `http://localhost:3001`）
  - `SOURCEMAP_SERVICE_NAME`（默认 `contract-frontend`）
  - `SOURCEMAP_RELEASE`（必填，除非存在 `RELEASE_ID` 或 `GITHUB_SHA`）

### 执行顺序（入口到结束）

1. `main()` 启动并打印配置。
2. 检查 release id 是否存在；缺少 `SOURCEMAP_RELEASE`、`RELEASE_ID`、`GITHUB_SHA` 时直接失败退出。
3. 检查 `DIST_DIR` 是否存在，不存在直接失败退出。
4. 递归扫描目录中的 `.map` 文件。
5. 若没有 `.map`，打印提示并正常结束。
6. 遍历文件并调用 `uploadSourceMap(filePath)`：
   - 构造 `PUT /v1/sourcemaps?service=<service>&release=<release>&filename=<relative map path>`
   - `filename` 使用相对 build output 的路径，例如 `assets/index-abc.js.map`
   - 非 2xx 视为单文件上传失败。
7. 汇总成功/失败数量。
8. 若存在失败数，`process.exit(1)`；否则成功退出。

### 关键函数注解

- `uploadSourceMap(filePath)`
  - 读取单个 `.map` 文件内容。
  - 向 resolver 发起 release-scoped `PUT`。
  - 非 2xx 抛错，由上层统计失败。

- `collectSourceMaps(rootDir)`
  - 递归收集 build output 下所有 `.map` 文件。

- `toUploadFilename(filePath)`
  - 生成上传协议使用的相对路径，保留 `assets/...` 层级。

- `main()`
  - 采取“逐个上传 + 汇总判定”的策略：
    - 单文件失败不立刻中断。
    - 最后统一根据 `failed` 决定退出码，便于 CI 明确感知整体成功/失败。

### 成功/失败条件

- 成功：
  - 所有 `.map` 上传成功；或
  - 目录内无 `.map` 文件。
- 失败：缺少 release id、目录不存在、任一上传失败、或未捕获异常。

### CI 常见调用

```bash
pnpm build
SOURCEMAP_RELEASE=<github.sha-or-tag> pnpm upload:sourcemaps
```

### 失败排查

- 缺 release id：确认 CI 传入 `SOURCEMAP_RELEASE`，或存在 `RELEASE_ID` / `GITHUB_SHA`。
- 目录不存在：确认已执行构建，且 `DIST_DIR` 指向正确。
- 无 `.map`：确认构建配置开启 sourcemap。
- 非 2xx：检查 endpoint 地址、权限、服务端路由、body 限制。

上传 endpoint 协议：

```text
PUT /v1/sourcemaps?service=<service>&release=<release>&filename=<relative map path>
```

服务端按 `SOURCEMAP_DIR/<service>/<release>/` 存储，resolver lookup key 是 `service.name + service.release + source_file`。`service.version` 是语义产品版本；`git.branch`、`git.commit`、`build.id`、`release.channel` 只作为查询上下文。

---

## 补充：为什么这三类脚本要做成“可失败即中断 CI”的守卫

- `check-px-whitelist`：防止设计约束失效。
- `check-unwrap-allowlist`：防止高风险 API 扩散。
- `upload-sourcemaps`：保证线上错误可追溯。

它们共同目标是：把“上线后难以补救的问题”前移到 CI 阶段尽早失败。
