Status: completed
Owner: frontend
Last verified: 2026-04-27
Source of truth: yes

# Trusted Types Rollout Plan

## 背景

当前前端 CSP 仍处于 `Content-Security-Policy-Report-Only` 阶段，静态 SPA 由 Nginx 下发 CSP：

- `/home/meteor/DEV/infra/stack/docker-setting/nginx/conf.d/dev.conf`

本轮目标是在现有 CSP 基础上引入 Trusted Types，并处理当前已知 HTML 注入边界：

- `src/assets/iconfont/iconfont.js` 是 iconfont 平台生成的供应商文件，运行时使用 `document.write` 与 `innerHTML`
- `src/modules/approval/presentation/print/printUtils.ts` 使用 `doc.write` 拼接完整打印 HTML，并插入 `targetEl.outerHTML`
- `src/modules/work-order` 使用 `md-editor-v3` 渲染 markdown，库内部存在 HTML sink，并且当前默认 `sanitize` 是 passthrough

## 目标

- 在 CSP `Report-Only` 中加入 Trusted Types 指令，先观察不强制阻断。
- 移除项目自有可控 HTML 字符串 sink。
- 将 iconfont 供应商 JS 改为构建期输入，生成安全 TSX sprite，不在运行时执行供应商 JS。
- 建立可复用的生成资产 hash/meta/check 机制，同时覆盖 iconfont 与 theme token CSS。
- 对 markdown sanitizer 只建立显式接入点与 fixture 回归，不在本轮直接强启用破坏性 sanitizer。
- 对 print 改造先补回归测试，再用 DOM API 替代字符串写入，避免样式展示回归。

## 非目标

- 不切换 CSP enforce。
- 不添加 `trusted-types default`。
- 不修改 `node_modules`。
- 不把 iconfont sprite 放入 `App.vue`。
- 不直接引入 DOMPurify 并改变 markdown 输出。
- 不执行 git commit / branch 操作，除非后续明确要求。

## 外部依据

- MDN `require-trusted-types-for`：https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for
- MDN `trusted-types`：https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/trusted-types
- OWASP XSS Prevention Cheat Sheet：https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- DOMPurify README：https://github.com/cure53/DOMPurify
- rehype-sanitize README：https://github.com/rehypejs/rehype-sanitize
- Mermaid security 配置：https://mermaid.js.org/config/usage
- Mermaid `securityLevel` schema：https://mermaid.js.org/config/schema-docs/config-properties-securitylevel.html
- Marked 文档与安全提示：https://marked.js.org/
- Vite Plugin API：https://vite.dev/guide/api-plugin

## 本地代码事实

- `md-editor-v3` 本地实现使用 `markdown-it({ html: true, breaks: true, linkify: true })`
- `md-editor-v3` 的 `sanitize` 默认值是 `(html) => html`
- `md-editor-v3` 的 Mermaid SVG 后处理使用单独 `sanitizeMermaid`
- work-order 当前已通过 `md-editor-loader.ts` 使用本地 `highlight.js / mermaid / katex` preview runtime，并通过 `noEcharts` 禁用 markdown 内置 ECharts，避免引入后再关闭
- `ZwIcon` 当前通过 `<use xlink:href="#icon-*">` 引用页面内 symbol
- 现有 `ThemeGeneratorVitePlugin.ts` 已是“源数据 -> 生成物”的 Vite 插件模式

## 决策摘要

1. Trusted Types 可以推进，但只加到 `Report-Only`。
2. 初始 CSP 指令为：

```text
require-trusted-types-for 'script'; trusted-types contract-frontend-html;
```

3. 不添加 `trusted-types default`，避免默认兜底掩盖真实 sink。
4. `iconfont.js` 按供应商输入处理，使用 Vite 插件提取 SVG symbol 并生成 TSX。
5. `printUtils` 是自有可控 sink，应改为 DOM API 构建打印文档，但必须先补样式与时序回归测试。
6. `md-editor-v3` 暂不强启用 sanitizer，只补项目级 `sanitize / sanitizeMermaid` 显式入口和 fixture，基于结果再决定后续策略。
7. 生成资产 hash/meta/check 机制抽为通用模块，theme token CSS 与 iconfont 共用。

## 文件结构

### 生成资产基础设施

- Create: `vite-plugin/shared/generated-asset.ts`
- Modify: `vite-plugin/ThemeGeneratorVitePlugin.ts`
- Create: `vite-plugin/IconfontSpriteVitePlugin.ts`
- Create: `scripts/check-generated-assets.mjs`
- Modify: `vite.config.ts`
- Modify: `package.json`

### Iconfont

- Move/Copy input: `src/assets/iconfont/iconfont.js` -> `src/assets/iconfont/vendor/iconfont.js`
- Generate: `src/assets/iconfont/generated/IconfontSprite.tsx`
- Generate: `src/assets/iconfont/generated/iconfont-meta.json`
- Create: `src/app/plugins/iconfont-sprite.ts`
- Modify: `src/main.ts`
- Modify: `src/app/__tests__/iconfont-entry.spec.ts`
- Modify: global CSS to add `.app-iconfont-sprite`

### Trusted Types / CSP

- Create: `src/modules/shared/application/security/trusted-types.ts`
- Modify: `scripts/check-csp-risk-patterns.mjs`
- Modify: `scripts/__tests__/check-csp-risk-patterns.spec.ts`
- Modify: `/home/meteor/DEV/infra/stack/docker-setting/nginx/conf.d/dev.conf`

### Print

- Modify: `src/modules/approval/presentation/print/printUtils.ts`
- Modify: `src/modules/approval/presentation/print/__tests__/printUtils.spec.ts`

### Markdown

- Create: `src/modules/work-order/presentation/markdown-security.ts`
- Modify: `src/modules/work-order/presentation/WorkOrderCreateModal.vue`
- Modify: `src/modules/work-order/presentation/WorkOrderDetailPage.vue`
- Modify: `src/modules/work-order/presentation/__tests__/WorkOrderMarkdownCsp.spec.ts`

### 文档

- Modify: `docs/how-to/operations/csp-rollout-template.md`
- Modify: `docs/index.md` if needed
- Modify: `docs/plans/completed/2026-04-21-trusted-types-rollout.md`

## Task 1: 通用生成资产管线

- [x] 为 `writeGeneratedAssetIfChanged` 写单元测试，覆盖 hash 相同不写、hash 不同写 output/meta、check 模式发现漂移。
- [x] 实现 `vite-plugin/shared/generated-asset.ts`。
- [x] 新增 `scripts/check-generated-assets.mjs`，复用同一套生成逻辑做 CI check。

## Task 2: Iconfont Vite 插件化

- [x] 为 iconfont 解析与安全校验写单元测试。
- [x] 将供应商输入固定为 `src/assets/iconfont/vendor/iconfont.js`。
- [x] 实现 `IconfontSpriteVitePlugin.ts`：
  - `buildStart` 生成一次
  - `handleHotUpdate` 只响应 vendor iconfont 文件
  - hash 输入为规范化 SVG 内容，不是完整 JS 包装
- [x] 生成 `IconfontSprite.tsx` 和 `iconfont-meta.json`。
- [x] 新增 `mountIconfontSprite()`，在 bootstrap 阶段挂载 TSX sprite。
- [x] 删除 `main.ts` 对 `@/assets/iconfont/iconfont.js` 的运行时导入。

## Task 3: Theme Generator 接入通用管线

- [x] 改造 `ThemeGeneratorVitePlugin.ts`，保留 token -> CSS 领域逻辑。
- [x] 使用通用生成资产管线写 `generated-theme.css` 与 `generated-theme.meta.json`。
- [x] dev 热更新只响应 `ThemeToken.ts`。
- [x] CSS 内容 hash 不变时不写文件、不 reload。

## Task 4: CSP / Trusted Types 扫描与基础设施

- [x] 扩展 `check-csp-risk-patterns.mjs` 风险规则：
  - `innerHTML`
  - `outerHTML`
  - `insertAdjacentHTML`
  - `document.write`
  - `DOMParser.parseFromString`
  - `Range.createContextualFragment`
  - `trustedTypes.createPolicy`
  - `v-html`
- [x] 新增 allowlist 机制，只允许明确审计过的生成/测试路径。
- [x] 新增 `trusted-types.ts`，集中创建 `contract-frontend-html` policy。
- [x] 更新 Nginx dev CSP Report-Only 指令。

## Task 5: Print sink 改造

- [x] 先补 `printUtils` 回归测试，覆盖样式复制、link 绝对化、打印时序。
- [x] 将 `doc.write + outerHTML` 改为 DOM API 构建打印文档。
- [x] 保留现有打印行为与 fallback 时序。
- [ ] 人工验证审批打印样式。

## Task 6: Markdown 安全接入与 fixture

- [x] 新增 `markdown-security.ts`，导出 `sanitizeMarkdownHtml` 与 `sanitizeMarkdownMermaid`。
- [x] 初始 sanitizer 兼容优先，不强清洗正常 markdown。
- [x] 所有 work-order `MdEditor / MdPreview` 显式传入 `sanitize / sanitizeMermaid`。
- [x] 扩展 fixture 覆盖：
  - 标题与 heading id
  - 表格
  - task list
  - 代码高亮 class
  - 图片与链接
  - KaTeX
  - Mermaid
  - raw HTML
  - iframe
  - `<script>`
  - 事件属性
  - `javascript:`
  - `iframe srcdoc`

## Markdown sanitizer 重点避坑

- `class` 被删除会破坏 syntax highlighting、admonition、task list、图片 zoom、KaTeX 与编辑器样式钩子。
- `data-*` 被删除会破坏 `data-line`、Mermaid post-processing、滚动同步和目录同步。
- `id/name` 的 DOM clobbering 防护会影响 heading anchor，需要先决定产品语义。
- KaTeX 输出复杂，默认 sanitizer 可能移除 MathML / class / style。
- Mermaid 有自己的 `securityLevel` 和 SVG 输出链路，必须单独治理。
- sanitizer 之后再由库改写 HTML 是安全 foot-gun，本项目必须把 Mermaid 作为独立后处理边界。

## Trusted Types / 第三方组件补充结论（2026-04-22）

### 权威资料一致结论

- Trusted Types 负责限制危险 sink 的入参类型，不负责判断字符串内容是否安全；安全判断仍需依赖转义、sanitizer 或禁用高风险能力。
- `trusted-types` CSP 应只允许显式审计过的 policy 名称；不建议用 `trusted-types default` 或宽松兜底 policy 吞掉真实 violation。
- markdown 渲染链路的主流安全路线是：
  - 优先禁用 raw HTML。
  - 如必须保留 HTML，使用专门 sanitizer，而不是手写正则长期兜底。
  - sanitizer 完成后，再在最后一步包装成 `TrustedHTML`。

### ECharts 结论

- ECharts 没有“官方 Trusted Types 开关”；主流做法不是为 ECharts 扩大 TT policy，而是尽量减少 HTML/DOM 路径。
- 官方文档明确：
  - `tooltip.renderMode` 默认是 `html`，可切到 `richText`，后者在 Canvas 内绘制 tooltip，可避免 HTML tooltip DOM 路径。
  - `tooltip.formatter` 若返回 HTML，动态内容必须先做 HTML escape，官方示例使用 `echarts.format.encodeHTML`。
  - `toolbox` 的 `dataView` / `saveAsImage` 属于更高风险的 HTML/文档写入能力，不应默认开启。
- 对本仓库的具体判断：
  - dashboard 当前真实启用的是 tooltip 链路，源码位于 `src/modules/agent-aggregate/presentation/dashboard/utils/chart-style.ts`。
  - 当前未发现 `toolbox.dataView` / `toolbox.saveAsImage` 已在业务代码中接入，因此这两类命中暂列为“包内残留能力”，不是当前已证实执行路径。
  - 后续若继续收敛，优先将 dashboard tooltip 统一评估为 `renderMode: 'richText'`；若必须保留 HTML tooltip，则所有动态值必须统一 escape。

### Markdown / md-editor-v3 结论

- markdown 编辑器场景的风险要分两层：
  - 用户输入内容本身是否含 active payload。
  - 渲染库内部是否仍然自己调用 `innerHTML`、`insertAdjacentHTML`、`DOMParser.parseFromString` 等 sink。
- `md-editor-v3` 的 `sanitize` / `sanitizeMermaid` 只是接入点，不等于库内部 sink 已被 Trusted Types 兼容化。
- 社区与官方文档共同支持的安全路线是：
  - 能禁 raw HTML 就禁 raw HTML。
  - 若不能禁，用成熟 sanitizer 处理输出，再进入最终 HTML sink。
  - 不应把“任意字符串直接包装成 TrustedHTML”当成 markdown 安全方案。
- 对本仓库的具体判断：
  - `src/modules/work-order/presentation/md-editor-loader.ts` 真实接入了 `highlight.js`、`mermaid`、`katex`、`cropperjs`；markdown 内置 ECharts 已通过 `noEcharts` 禁用，loader 不再注册 `echarts` runtime。
  - `/work-order` 仍不是抽象风险，因为 markdown / Mermaid / KaTeX / 编辑器辅助能力均会进入预览渲染或编辑器运行链路，后续应继续观察真实 TT report。
  - 当前 `markdown-security.ts` 的兼容优先最小清洗可作为 rollout 过渡态，但不能替代标准 sanitizer 的长期职责。
  - 若后续进入强化阶段，优先方向应是“禁 raw HTML 或引入标准 sanitizer + fixture 回归”，而不是扩大 TT policy 权限面。

### Mermaid 结论

- Mermaid 需要单独治理，不能和普通 markdown HTML sink 混为一谈。
- 官方配置提供 `securityLevel`；安全取向优先 `strict` 或更保守模式，而不是宽松模式。
- 对本仓库的具体判断：
  - 当前依赖版本是 `mermaid@11.9.0`。
  - 后续若要继续收敛 `/work-order` 风险，应先确认当前 runtime 是否显式声明了 `securityLevel`，并评估是否可切到 `strict` 或 `sandbox`。

### 当前 Trusted Types policy 边界

- 当前 `src/modules/shared/application/security/trusted-types.ts` 中的 `contract-frontend-html` policy 使用：

```ts
createHTML(input) {
  return input
}
```

- 该实现可以作为 rollout 期兼容桥接，但不是最终安全形态；它不能证明输入内容已被净化，只是把字符串包装为 Trusted Types 对象。
- 后续应避免把这个 policy 扩散成“任意字符串通行证”：
  - 能通过配置关闭 HTML 路径的第三方库，优先关路径，不优先加 policy。
  - 需要进入 HTML sink 的业务内容，应先过转义或 sanitizer，再在最后一步包装。
  - 不新增 `trusted-types default`。

### 当前建议优先级

1. `/work-order` markdown 链路继续作为 P0 风险面观测与定向验证目标。
2. dashboard 图表链路优先检查 tooltip 是否可切 `richText`，而不是先处理包内未启用的 toolbox 残留。
3. `print-js` 仍是打印链路的真实后续改造对象；`printUtils.ts` 目前不是现网调用链主入口。
4. 当前宽松 `contract-frontend-html` policy 仅保留为 rollout 过渡手段，不作为后续吸收第三方 sink 的默认方案。

### 对应信源

- W3C Trusted Types 规范：https://www.w3.org/TR/trusted-types/
- MDN Trusted Types API：https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API
- MDN `require-trusted-types-for`：https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for
- MDN `trusted-types`：https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/trusted-types
- web.dev Trusted Types 指南：https://web.dev/trusted-types/
- Apache ECharts tooltip `renderMode` / `formatter` 文档：https://echarts.apache.org/
- markdown-it safety 文档：https://github.com/markdown-it/markdown-it/blob/master/docs/security.md
- DOMPurify README：https://github.com/cure53/DOMPurify
- Mermaid 配置与 `securityLevel` 文档：
  - https://mermaid.js.org/config/usage
  - https://mermaid.js.org/config/schema-docs/config-properties-securitylevel.html

## 验证计划

### 定向测试

```bash
pnpm test:unit --run scripts/__tests__/check-csp-risk-patterns.spec.ts
pnpm test:unit --run src/app/__tests__/iconfont-entry.spec.ts
pnpm test:unit --run src/modules/approval/presentation/print/__tests__/printUtils.spec.ts
pnpm test:unit --run src/modules/work-order/presentation/__tests__/WorkOrderMarkdownCsp.spec.ts
```

### 生成资产与安全检查

```bash
pnpm check:generated
pnpm check:csp
```

### 仓库级验证

```bash
pnpm test:unit --run
pnpm check
pnpm build
```

### 手动验证

- 工单创建 markdown editor 能正常打开、输入、上传图片。
- 工单详情 markdown preview 样式无明显回归。
- 工单回复 editor 能正常打开、输入。
- 审批打印样式与布局无明显回归。
- `ZwIcon` 图标正常显示。
- 浏览器 CSP / Trusted Types violation 能进入现有观测链路。

## 完成标准

- 所有新行为有自动化测试。
- `pnpm check:generated` 能发现生成物漂移。
- `pnpm check:csp` 能发现未审计 HTML sink。
- 不执行供应商 `iconfont.js`。
- `printUtils` 不再使用 `doc.write` 或 `outerHTML` 字符串拼接。
- markdown 不因本轮改造强制改变既有展示行为。
- Nginx 只进入 Trusted Types Report-Only 阶段。

## 当前执行结果

- 已完成 iconfont 供应商脚本移出运行时，改为 Vite 插件生成 TSX sprite，并补入口/插件测试。
- 已完成 theme token CSS 接入通用 generated asset hash/meta/check 管线。
- 已完成 `check:csp` 风险扫描扩展与 allowlist，当前 `pnpm check:csp:src` 为 `ok`。
- 已完成 `printUtils` 从 `doc.write + outerHTML` 迁移到 DOM API 构建打印文档。
- 已完成 work-order markdown 显式 `sanitize / sanitizeMermaid` 接入，并补兼容优先的 fixture 测试。
- 已完成 dev Nginx `Content-Security-Policy-Report-Only` 追加：

```text
require-trusted-types-for 'script'; trusted-types contract-frontend-html;
```

- 归档状态：
  - 自有 HTML/script sink 收敛、Markdown DOMPurify 标准化、CSP/TT Report-Only 观测链路均已完成到本计划 stop line。
  - 工单 markdown Report-Only gate 已记录在下方 closure；最终状态为 Path B（受控第三方例外）。
  - 生产环境是否进入 enforce、以及 SigNoz 中生产 `/assets/*.js` violation 是否归零，属于后续 rollout gate，不阻塞本实现计划归档。

## Markdown DOMPurify / Trusted Types closure (2026-04-24)

- Markdown HTML 和 Mermaid SVG sanitization 现已改为 DOMPurify，不再使用临时 regex 主路径。
- 共享 Trusted Types HTML helper 已不再接受未经校验的原始字符串。
- `md-editor-loader.ts` 仍是 markdown 安全 props 的唯一业务入口。
- Final markdown TT state: documented third-party exception.
- Chromium Report-Only gate 结论：
  - 工单 markdown 页面在 `/work-order/1` 下可正常进入，代码块、KaTeX、Mermaid 渲染仍可工作。
  - `iframe` / `javascript:` / 事件属性未以活跃 DOM 节点形式落入页面；对应内容仅作为文本显示。
  - DOMPurify 自身新增的 `dompurify` policy 噪音已通过复用现有 `contract-frontend-html` policy 收口。
  - 剩余 Trusted Types violation 主要来自 markdown 第三方链路内部 sink（`mermaid.js`、`md-editor-v3` 相关 chunk）以及 dev Vue/Vite 注入噪音。
  - 按 stop line 进入 Path B：将 markdown TT 边界记录为受控第三方例外，不继续深挖 `md-editor-v3`，不扩大 policy。
- Explicitly retained constraints:
  - no `trusted-types default`
  - no widened policy names
  - no `node_modules` patching

## Archive Summary (2026-04-27)

- Implementation state: completed and archived.
- Stop line: Trusted Types remains Report-Only; enforce mode requires a separate production readiness gate.
- Residual observation work belongs in operational CSP/SigNoz dashboards, not in this implementation plan.
