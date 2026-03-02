# 性能排查手册 (FCP/LCP/TTI)

本手册定义了一套可重复的性能排查流程。
当打包体积增长或 Lighthouse 指标出现回退时，按此流程执行。

## 1) 确定测量范围（最先锁定）

- 页面：每次只选一条路由（例如 `/login`）。
- 构建模式：始终使用生产构建 + preview 模式，不要用开发服务器。
- 次数：每个场景跑 3 次，取中位数。
- 指标：聚焦 `FCP`、`LCP`、`TTI`。

## 2) 基线采集流程

```bash
pnpm build
pnpm preview --host 127.0.0.1 --port 5199
```

在另一个终端执行：

```bash
for i in 1 2 3; do
  pnpm dlx lighthouse "http://127.0.0.1:5199/login" \
    --preset=desktop \
    --throttling-method=provided \
    --chrome-flags="--headless --no-sandbox" \
    --output=json \
    --output-path="/tmp/lh-login-$i.json" >/dev/null
done
```

汇总中位数：

```bash
node - <<'NODE'
const fs = require('fs')
const runs = [1, 2, 3].map((i) => JSON.parse(fs.readFileSync(`/tmp/lh-login-${i}.json`, 'utf8')))
const median = (key) => runs.map((r) => r.audits[key].numericValue).sort((a, b) => a - b)[1]
console.log({
  FCP_s: +(median('first-contentful-paint') / 1000).toFixed(2),
  LCP_s: +(median('largest-contentful-paint') / 1000).toFixed(2),
  TTI_s: +(median('interactive') / 1000).toFixed(2),
})
NODE
```

## 3) 默认阈值

以下为起始阈值，可根据业务场景和设备条件调整：

- `FCP < 1.8s`
- `LCP < 2.5s`
- `TTI < 3.8s`

## 4) 根因定位 SOP（按顺序执行）

1. 先检查 LCP 元素及其资源加载情况。
2. 检查最大网络请求（`network-requests`）。
3. 检查 JS 执行开销（`bootup-time`、`mainthread-work-breakdown`）。
4. 最后再看原始 bundle/chunk 体积。

为什么按这个顺序：

- LCP/TTI 回退通常源于执行或渲染瓶颈，不单是字节数问题。
- 仅靠打包体积无法解释所有性能回退。

## 5) 决策树

- 如果 FCP 偏慢：
  - 减少入口处的阻塞性 CSS/JS。
  - 延迟非关键的启动初始化逻辑。
- 如果 LCP 偏慢：
  - 优化 LCP 元素的传输顺序。
  - 确保 LCP 资源尽早被浏览器发现。
- 如果 TTI 偏慢：
  - 减少主线程 JS 工作量。
  - 将非必要的初始化移到空闲或延迟阶段。

## 6) 变更策略

- 每次只改一个变量。
- 每次改动后重新执行 3 次中位数采集流程。
- 指标达到约定阈值后即可停止优化。

## 7) 报告模板

每个优化 PR 或任务使用以下模板记录：

```text
目标路由：
测试环境：
采集方式：3 次中位数

优化前：FCP/LCP/TTI =
优化后：FCP/LCP/TTI =

所做变更：
变更预期效果：
观察到的副作用：
结论：保留 / 回滚
```

## 8) 本项目注意事项

- 不要用 `vite dev` 的数据作为基线，必须使用 `build + preview`。
- 保持路由级懒加载边界清晰。
- 启动路径中延迟加载非关键的可观测性和诊断模块。
- 不要仅为消除 chunk-size 警告而优化，要以目标指标为导向。

## 9) 本轮 `/login` 首屏排查结论（2026-03-02）

### 已完成工作

- 已完成依赖漏洞修复、lint 错误修复、入口路径修复。
- 已完成 Markdown 编辑器相关的按需加载与 loading 策略调整。
- 已完成“登录前轻量、登录后增强”方向改造（请求持久化延后、守卫轻路径、未登录路径与重依赖解耦）。
- 已完成针对 `/login` 的 Lighthouse 3 次中位数验证（移动端 + 桌面端）。

### 首屏文件体积（本地资源）

- `index.html`: `748 B`
- `assets/index-BnxQb5j1.js`: `773,273 B`
- `assets/index-Dhfxj0jW.css`: `38,593 B`
- `assets/global-loading-B4XsCd70.gif`: `56,389 B`
- 本地首屏资源合计：`869,003 B`（约 `848.6 KiB`）

占比结论（按 `848.6 KiB`）：

- 主入口 JS：约 `89.0%`
- loading gif：约 `6.5%`
- 入口 CSS：约 `4.4%`

### 主入口 JS（`index-*.js`）构成结论

基于 sourcemap treemap 分析，主入口 JS 主要由基础框架与通用库构成：

- `Naive UI`: 约 `34.4%`
- 其他依赖聚合（如 `object-inspect` / `get-intrinsic` / `ts-pattern` / `dayjs` / `qs` / `pinia` 等）：约 `17.7%`
- `i18n`（`vue-i18n` + `@intlify/*` + `zh/en` 词条）：约 `12.9%`
- `Vue core/runtime`: 约 `10.4%`
- `Axios`: 约 `5.0%`
- `TanStack Query`: 约 `4.9%`
- `Vue Router`: 约 `3.1%`

结论：当前体积大头不是单一异常模块，而是框架与基础能力的正常成本。

### 指标结果（Lighthouse，3 次中位数）

- 移动端：`FCP 2102ms` / `LCP 3789ms` / `TTI 4184ms` / `TBT 140ms` / `Score 85`
- 桌面端：`FCP 603ms` / `LCP 831ms` / `TTI 831ms` / `TBT 0ms` / `Score 99`

### 排查方向与后续策略

- 当前阶段结论：可暂停进一步拆分优化，优先稳定现状并持续监控指标。
- `global-loading.gif`（约 `56KB`）作为应用挂载前加载反馈，保留是合理选择。
- 后续仅保留两个高性价比可选项（按需再做）：
  - 优化外链 iconfont 脚本加载策略（降低潜在阻塞）。
  - i18n 词条按需加载（仅在切换语言时加载非默认语言词条）。

### 常用体积火焰图命令

```bash
pnpm dlx vite-bundle-visualizer --template treemap --output /tmp/vite-bundle-treemap.html --open false --mode production --sourcemap
```
