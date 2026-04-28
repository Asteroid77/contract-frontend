Status: active
Owner: frontend
Last verified: 2026-04-12
Source of truth: yes

# CSP Rollout Template

本模板用于为任意前端应用编写一份可执行的 CSP 文档。
目标不是直接复制一段固定 header，而是把“应用实际加载什么资源、允许哪些来源、如何 rollout”记录清楚。

## 1. 何时使用

适用于以下场景：

- 新应用首次接入 CSP
- 现有应用从宽松策略收紧到更严格策略
- 需要将 `Report-Only` 过渡到 enforce
- 需要整理 `script-src`、`connect-src`、`img-src`、`frame-src` 等来源清单

不适用于：

- 一次性的审计报告
- 当前应用的最终策略事实归档
- 仅记录某次变更 diff 的实施计划

## 2. 文档定位

本文件是通用模板，回答“如何设计和 rollout CSP”。

对于具体应用，建议这样分层：

- rollout 期间：放在 `plans/active/` 或当前任务的实施文档里
- 稳定后的应用实例：放在 `reference/` 或该应用对应的长期维护文档里
- 复盘和违规分析：放在 `reports/`

## 3. 使用方式

复制下面的模板块，创建一份当前应用专用的 CSP 文档，然后把每个占位项替换成真实内容。

```md
Status: active
Owner: <team-or-repo>
Last verified: YYYY-MM-DD
Source of truth: yes|no

# <App Name> CSP Rollout

## Purpose

- 本文档用于定义当前应用的 CSP 目标、来源清单、rollout 方式和验证方法。

## Deployment Context

- Application type: SPA / SSR / static site / hybrid
- Delivery layer: Nginx / CDN / edge / application server
- Policy injection point: response header / hosting config / edge rule
- Initial mode: `Content-Security-Policy-Report-Only` / `Content-Security-Policy`

## Resource Model

- `script-src`
  - 当前应用执行哪些脚本
  - 是否存在第三方脚本
  - 是否仍有 inline script
- `style-src`
  - 是否需要 inline style
  - 是否有 runtime 注入样式
- `img-src`
  - 是否包含 `data:` / `blob:`
  - 是否包含外部 CDN / OSS
- `connect-src`
  - API
  - WebSocket / HMR
  - telemetry / replay / upload
- `font-src`
  - 本地字体 / 外部字体来源
- `frame-src`
  - iframe / PDF / preview / embed
- `worker-src`
  - Web Worker / blob worker
- `manifest-src`
  - 是否使用 web manifest

## Reporting Model

- Browser-native reporting:
  - 是否配置 `report-uri`
  - 是否配置 `Reporting-Endpoints` + `report-to`
- Frontend-enriched reporting:
  - 是否监听 `securitypolicyviolation`
  - 是否补充 route / sessionId / sessionUrl / traceId / spanId
- Collection path:
  - 是否走 same-origin proxy，而不是直接放开外部 telemetry 域名
  - report endpoint 最终落到哪个服务

## Stable Baseline

以下项通常优先固定：

- `default-src 'self'`
- `object-src 'none'`
- `base-uri 'self'`
- `form-action 'self'`
- `frame-ancestors 'self'`

如果当前应用明确需要更宽的范围，必须在“Known Exceptions”中说明原因。

如果计划引入 Trusted Types，建议额外明确：

- 是否只在 `Report-Only` 先观察，还是直接进入 enforce
- `trusted-types` 允许的 policy 名称
- 是否启用 `require-trusted-types-for 'script'`
- 是否显式禁止 `trusted-types default`
- 哪些 sink 通过工程化改造移除，哪些保留为审计过的兼容边界

## Directive Matrix

| Directive | Baseline | App-specific sources | Why needed | Can tighten later |
|-----------|----------|----------------------|------------|-------------------|
| `default-src` | `'self'` | `<fill>` | `<fill>` | yes/no |
| `script-src` | `'self'` | `<fill>` | `<fill>` | yes/no |
| `style-src` | `'self'` | `<fill>` | `<fill>` | yes/no |
| `img-src` | `'self' data: blob:` | `<fill>` | `<fill>` | yes/no |
| `connect-src` | `'self'` | `<fill>` | `<fill>` | yes/no |
| `font-src` | `'self' data:` | `<fill>` | `<fill>` | yes/no |
| `frame-src` | `'self'` | `<fill>` | `<fill>` | yes/no |
| `worker-src` | `'self' blob:` | `<fill>` | `<fill>` | yes/no |
| `manifest-src` | `'self'` | `<fill>` | `<fill>` | yes/no |

## Proposed Header

### Report-Only

```http
Content-Security-Policy-Report-Only: <fill>
```

```http
Reporting-Endpoints: <fill>
```

### Enforce

```http
Content-Security-Policy: <fill>
```

## Environment Overrides

- Local development:
  - 是否需要 HMR WebSocket
  - 是否存在本地 API / mock / preview 域名
- Staging:
  - 是否与生产同源
  - 是否有额外调试域名
- Production:
  - 最终允许来源清单

## Known Exceptions

- `<source>` for `<directive>`
  - reason:
  - owner:
- removal condition:

## Trusted Types Rollout

- Initial mode:
  - `Report-Only` / enforce
- Policy names:
  - `<fill>`
- Initial directives:

```http
require-trusted-types-for 'script'; trusted-types <fill>;
```

- Non-goals:
  - 是否避免 `trusted-types default`
  - 是否暂不处理第三方库内部 sink
- Sink inventory:
  - `<fill>`: 构建期生成替代 / DOM API 重写 / 显式 sanitizer 接入 / 暂缓
- Verification:
  - HTML sink 扫描脚本是否已覆盖 `innerHTML`、`outerHTML`、`insertAdjacentHTML`、`document.write`、`DOMParser.parseFromString`、`Range.createContextualFragment`、`trustedTypes.createPolicy`、`v-html`
  - 浏览器 `securitypolicyviolation` 与原生 report 是否能采集到 Trusted Types violation

## Rollout Plan

1. 先上 `Report-Only`
2. 观察浏览器 console / report / 真实业务路径
3. 去掉不必要来源
4. 收紧动态来源
5. 切到 enforce

## Verification Checklist

- 响应头实际出现在浏览器 response headers 中
- 未登录和已登录核心路径均能正常打开
- 上传、预览、iframe、telemetry 等特殊路径已验证
- console 中没有新的非预期 CSP violation
- 与 CSP 相关的外链脚本、外链图片、外链 iframe 已有明确归属
- browser-native report 已能送达接收端
- 如果启用了 `securitypolicyviolation` collector，增强事件已能送达 observability
- development 噪音不应在 frontend collector 中提前丢弃；默认在 SigNoz 查询或看板层过滤已知 dev noise，保留原始事件用于对账。

## Exit Criteria

- 当前应用所有必要来源都已在文档中列出
- `Report-Only` 违规已收敛
- 可以明确说明哪些来源是临时例外
- 已具备切 enforce 的条件
```

## 4. 填写原则

### 4.1 先列资源，再写 header

不要直接从“我想写一条多严的 header”开始，而要先回答：

- 页面会执行哪些脚本
- 页面会向哪些地址发请求
- 页面会加载哪些图片、字体、iframe
- 哪些是本地资源，哪些是第三方来源

### 4.2 先写 `Report-Only`

默认先以 `Report-Only` 方式上线，除非：

- 当前应用来源非常稳定
- 已完成足够的浏览器级验证
- 团队明确接受直接 enforce 的回归风险

### 4.3 不要把“临时例外”写成默认基线

例如：

- 第三方 telemetry 域名
- 外部 preview 域名
- 历史遗留的外链脚本

这些都应写在 `App-specific sources` 或 `Known Exceptions`，不要混入稳定基线。

### 4.4 telemetry 尽量走 same-origin proxy

如果应用已经有 observability / replay / upload 之类的外部连接，优先考虑：

- 前端只连 same-origin 路径
- 由 Nginx / edge 代理到真实上游
- CSP `connect-src` 保持 `'self'` + 少量必要例外

这样通常比直接把多个 telemetry 域名写进 `connect-src` 更容易治理，也更利于后续切 enforce。

## 5. 常见误区

- 把 CSP 当成后端业务权限系统
- 只写一段 header，不写来源清单
- 直接 enforce，不经过 `Report-Only`
- 用过宽的 `https:`、`*` 长期代替明确 allowlist
- 把设计上已经解决的问题继续写成额外 fallback 规则

## 6. 当前仓库使用建议

对于本仓库：

- 通用模板保留在本文件
- 当前应用的具体 CSP 决策，放在对应的 active plan / reference 文档里
- 最终 Nginx 实际 header 配置，仍应在 infra 仓库维护
