Status: completed
Owner: frontend
Last verified: 2026-04-14
Source of truth: yes

# Frontend Observability Trace / Replay Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 frontend `trace/replay` 的对外入口统一收敛到 `frontend-observability` 命名空间，同时保持下游仍由 OTEL Collector 和 OpenReplay 原生后端处理。

**Architecture:** frontend 默认配置切换到 `/observability/frontend/v1/traces` 与 `/observability/frontend/replay`；Nginx 新增统一入口并保留旧路径兼容窗口；`frontend-observability` Node 服务继续只承接 `events/security/sourcemap/symbolicate`，不重写 traces/replay 协议接收逻辑。

**Tech Stack:** Vue 3, Vite, Vitest, OpenTelemetry Web SDK, OpenReplay Tracker, Nginx, Docker Compose

---

## Completion Summary (2026-04-14)

- 文档同步已完成：`frontend-observability.md` 与 `openreplay-setup.md` 已切换到新 trace/replay 入口说明
- design / implementation plan 已迁移到 `docs/plans/completed/`
- 兼容窗口保留为 `/observability/otel` 与 `/observability/replay`
- 验证边界：已完成前端定向单测与静态配置校验；未在本次记录中声明 Nginx reload / live smoke 已执行

## Implementation Notes

- 本计划不包含 `git commit` 步骤。仓库规则要求除非用户明确要求，否则不要计划或执行 commit / branch 操作。
- `trace` 迁移是 frontend 默认 endpoint + Nginx 路由改动，不需要改 `frontend-observability` Node 服务的 HTTP route。
- `replay` 迁移是 frontend 默认 ingest prefix + Nginx 前缀代理改动，不需要新增 `v1/replay` 业务接口。

## File Map

### Frontend Repo

- Modify: `src/app/observability/index.ts`
  - 将默认 `otelEndpoint` 从 `/observability/otel` 切到 `/observability/frontend/v1/traces`
- Modify: `src/app/observability/__tests__/index.spec.ts`
  - 验证默认 traces endpoint 已切到新路径
- Modify: `src/app/observability/replay/openreplay.ts`
  - 将默认 replay ingest prefix 从 `/observability/replay` 切到 `/observability/frontend/replay`
- Modify: `src/app/observability/replay/__tests__/openreplay.spec.ts`
  - 验证 replay 默认路径与同源相对路径解析已切到新前缀
- Modify: `docs/how-to/operations/frontend-observability.md`
  - 更新 trace/replay 统一入口说明
- Modify: `docs/how-to/operations/openreplay-setup.md`
  - 更新 OpenReplay ingest 配置与排障说明
- Modify: `docs/plans/completed/2026-04-14-frontend-observability-trace-replay-design.md`
  - 实现完成后补充结果并移入 `completed/`

### Infra Repo

- Modify: `/home/meteor/DEV/infra/stack/docker-setting/nginx/conf.d/dev.conf`
  - 新增 `/observability/frontend/v1/traces` 与 `/observability/frontend/replay/` 路由
  - 保留 `/observability/otel/` 与 `/observability/replay/` 兼容窗口
- Modify: `/home/meteor/DEV/infra/stack/docker-setting/frontend-observability/README.md`
  - 说明统一入口下的 trace/replay 分流职责

### Service Repo

- No route changes expected: `/home/meteor/DEV/projects/test/frontend-observability/src/http/server.ts`
  - 本轮只确认服务职责边界，不新增 traces/replay API

## Task 1: 切换 frontend 默认 traces endpoint

**Files:**
- Modify: `src/app/observability/index.ts`
- Modify: `src/app/observability/__tests__/index.spec.ts`

- [ ] **Step 1: 先写失败测试，锁定默认 traces endpoint 切换行为**

在 `src/app/observability/__tests__/index.spec.ts` 新增断言：不传 `observability.otelEndpoint` 时，`initTracer` 收到的配置应使用同源 `/observability/frontend/v1/traces`。

```ts
it('uses unified frontend traces endpoint by default', async () => {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  const module = await import('@/app/observability')
  const app = { config: {} }

  module.initObservability(app as never, {
    observability: {
      enabled: true,
    },
  })

  expect(initTracerSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      otelEndpoint: `${window.location.origin}/observability/frontend/v1/traces`,
    }),
  )

  logSpy.mockRestore()
})
```

- [ ] **Step 2: 运行测试，确认它先失败**

Run:

```bash
pnpm test:unit --run "src/app/observability/__tests__/index.spec.ts"
```

Expected:

- 新增用例失败
- 失败信息显示实际默认值仍是 `/observability/otel`

- [ ] **Step 3: 写最小实现**

在 `src/app/observability/index.ts` 只修改默认 endpoint 与 fallback，不改 tracer 本身：

```ts
otelEndpoint:
  resolveEndpoint(import.meta.env.VITE_OTEL_ENDPOINT) ||
  '/observability/frontend/v1/traces'

config.otelEndpoint =
  resolveEndpoint(config.otelEndpoint) ||
  `${window.location.origin}/observability/frontend/v1/traces`
```

- [ ] **Step 4: 重新运行测试，确认通过**

Run:

```bash
pnpm test:unit --run "src/app/observability/__tests__/index.spec.ts" "src/app/observability/otel/__tests__/tracer.spec.ts"
```

Expected:

- `index.spec.ts` 全绿
- `tracer.spec.ts` 不回归

## Task 2: 切换 frontend 默认 replay ingest prefix

**Files:**
- Modify: `src/app/observability/replay/openreplay.ts`
- Modify: `src/app/observability/replay/__tests__/openreplay.spec.ts`

- [ ] **Step 1: 先写失败测试，锁定 replay 新前缀**

把现有 `openreplay.spec.ts` 中与默认路径、同源相对路径相关的断言改成新前缀：

```ts
expect(trackerCtor).toHaveBeenCalledWith(
  expect.objectContaining({
    ingestPoint: `${window.location.origin}/observability/frontend/replay`,
  }),
)
```

至少覆盖两种情况：

- 显式传入 `'/observability/frontend/replay'`
- 未传 `ingestPoint` 时默认回落到 `'/observability/frontend/replay'`

- [ ] **Step 2: 运行测试，确认它先失败**

Run:

```bash
pnpm test:unit --run "src/app/observability/replay/__tests__/openreplay.spec.ts"
```

Expected:

- 新增或修改后的用例失败
- 失败信息显示当前实现仍指向旧路径 `/observability/replay`

- [ ] **Step 3: 写最小实现**

在 `src/app/observability/replay/openreplay.ts` 只调整默认 prefix：

```ts
const ingestPoint = resolveEndpoint(
  config.ingestPoint || '/observability/frontend/replay',
)
```

不要新增任何 replay schema、Node 接收逻辑或 `v1/replay` API。

- [ ] **Step 4: 重新运行测试，确认通过**

Run:

```bash
pnpm test:unit --run "src/app/observability/replay/__tests__/openreplay.spec.ts" "src/app/observability/__tests__/index.spec.ts"
```

Expected:

- `openreplay.spec.ts` 全绿
- `index.spec.ts` 仍全绿

## Task 3: 增加统一入口 Nginx 路由并保留兼容窗口

**Files:**
- Modify: `/home/meteor/DEV/infra/stack/docker-setting/nginx/conf.d/dev.conf`
- Modify: `/home/meteor/DEV/infra/stack/docker-setting/frontend-observability/README.md`

- [ ] **Step 1: 修改 Nginx 路由，先保留旧入口**

在 `dev.conf` 中保留现有旧路由，同时新增：

```nginx
location = /observability/frontend/v1/traces {
    proxy_pass http://otel_collector/v1/traces;
    proxy_http_version 1.1;
    proxy_set_header Host $proxy_host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location /observability/frontend/replay/ {
    proxy_pass http://openreplay_ingest/;
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_set_header Host $proxy_host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

同时把 `/home/meteor/DEV/infra/stack/docker-setting/frontend-observability/README.md` 更新为：

```md
- Same-origin ingress is exposed by `nginx/conf.d/dev.conf` at `/observability/frontend/`.
- `trace` is routed from `/observability/frontend/v1/traces` to the OTEL Collector.
- `replay` is routed from `/observability/frontend/replay/` to the OpenReplay ingest upstream.
```

- [ ] **Step 2: 验证配置文件已包含新路由**

Run:

```bash
rg -n "observability/frontend/v1/traces|observability/frontend/replay" \
  "/home/meteor/DEV/infra/stack/docker-setting/nginx/conf.d/dev.conf" \
  "/home/meteor/DEV/infra/stack/docker-setting/frontend-observability/README.md"
```

Expected:

- `dev.conf` 中能看到新 trace 精确路由
- `dev.conf` 中能看到新 replay 前缀路由
- README 中能看到新分流说明

- [ ] **Step 3: reload 后做最小 smoke 验证**

Run:

```bash
curl -k -s -o /dev/null -w '%{http_code}\n' \
  --resolve 'dev.astro777.cfd:443:127.0.0.1' \
  -X POST 'https://dev.astro777.cfd/observability/frontend/v1/traces' \
  -H 'Content-Type: application/json' \
  --data '{}'
```

Expected:

- 返回值不是 `404`
- 若收到 `400` / `415`，可接受，说明请求已进入 Collector 类下游而不是卡在 Nginx 路由缺失

Run:

```bash
curl -k -I \
  --resolve 'dev.astro777.cfd:443:127.0.0.1' \
  'https://dev.astro777.cfd/observability/frontend/replay/'
```

Expected:

- 返回值不是 `404`
- 若收到上游产品自己的状态码，说明 replay 前缀已命中 OpenReplay upstream

## Task 4: 更新运行文档并完成迁移留痕

**Files:**
- Modify: `docs/how-to/operations/frontend-observability.md`
- Modify: `docs/how-to/operations/openreplay-setup.md`
- Modify: `docs/plans/completed/2026-04-14-frontend-observability-trace-replay-design.md`
- Move when complete: `docs/plans/completed/2026-04-14-frontend-observability-trace-replay-design.md`
- Move when complete: `docs/plans/completed/2026-04-14-frontend-observability-trace-replay-plan.md`
- Modify: `docs/index.md`

- [ ] **Step 1: 更新运维文档中的路径说明**

将 `frontend-observability.md` 改成新边界：

```md
- traces now go through `/observability/frontend/v1/traces`
- replay now goes through `/observability/frontend/replay`
- `/observability/otel` and `/observability/replay` remain temporary compatibility paths during migration
```

将 `openreplay-setup.md` 中所有默认配置、排障说明和示例改成：

```bash
VITE_OPENREPLAY_INGEST_POINT = /observability/frontend/replay
```

- [ ] **Step 2: 以实现结果回填 design 文档**

在 `docs/plans/completed/2026-04-14-frontend-observability-trace-replay-design.md` 补充：

- 已落地的新 trace 入口
- 已落地的新 replay 前缀
- 保留的兼容窗口
- 验证边界

- [ ] **Step 3: 更新索引并 completed 化**

实现与验证全部通过后：

- 将 design 文档移到 `docs/plans/completed/`
- 将本 implementation plan 也移到 `docs/plans/completed/`
- 在 `docs/index.md` 的 completed plans 下补索引

验证：

```bash
rg -n "frontend-observability-trace-replay" "docs/index.md" "docs/plans/completed"
```

Expected:

- `docs/index.md` 能找到 completed plan 条目
- `docs/plans/completed/` 下能找到 design 与 implementation plan

## Task 5: 最终验证

**Files:**
- Verify only; no new files expected

- [ ] **Step 1: 运行前端定向测试**

Run:

```bash
pnpm test:unit --run \
  "src/app/observability/__tests__/index.spec.ts" \
  "src/app/observability/otel/__tests__/tracer.spec.ts" \
  "src/app/observability/replay/__tests__/openreplay.spec.ts"
```

Expected:

- 三组测试全部通过

- [ ] **Step 2: 运行格式与静态检查**

Run:

```bash
pnpm exec oxfmt --check \
  "src/app/observability/index.ts" \
  "src/app/observability/__tests__/index.spec.ts" \
  "src/app/observability/replay/openreplay.ts" \
  "src/app/observability/replay/__tests__/openreplay.spec.ts"
```

Run:

```bash
pnpm exec oxlint \
  "src/app/observability/index.ts" \
  "src/app/observability/__tests__/index.spec.ts" \
  "src/app/observability/replay/openreplay.ts" \
  "src/app/observability/replay/__tests__/openreplay.spec.ts"
```

Expected:

- `oxfmt` 通过
- `oxlint` 无新增错误；若仍有仓库既有 `console` 警告，需明确标注为历史或既有问题

- [ ] **Step 3: 运行态验收**

Run:

```bash
curl -k --resolve 'dev.astro777.cfd:443:127.0.0.1' \
  'https://dev.astro777.cfd/observability/frontend/health'
```

Expected:

- 返回 `200`

Manual verification:

- 打开前端页面并确认应用初始化正常
- 在浏览器会话中确认 `sessionStorage.getItem('openreplay_session_id')` 存在
- 在 OpenReplay 后台确认能看到新 session
- 在 SigNoz / Collector 侧确认新路径下能观察到 frontend traces

Expected:

- 新路径已实际生效
- frontend 不依赖旧路径才能初始化
- 旧路径仍可作为兼容入口存在，直到用户明确要求移除
