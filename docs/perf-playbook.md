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
