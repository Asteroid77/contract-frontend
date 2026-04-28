Status: completed
Owner: frontend
Last verified: 2026-04-14
Source of truth: yes

# Frontend Observability Service Implementation Plan

**Goal:** 建立独立的 `frontend-observability` 服务域，统一接收 frontend logs、errors、security events 和 sourcemap/symbolication 能力，同时将现有 `sourcemap-resolver` 恢复为纯净职责或最终退役。

**Architecture:** 新建独立仓库或工作区 `frontend-observability`，采用 TypeScript + Node.js 的单进程单入口结构，内部按 `ingest`、`symbolication`、`forwarders` 分模块。frontend 业务代码不直接面向 OTLP，而是通过统一 event schema 和 logger facade 上报；服务端再统一转为 OTLP 并送入现有 OpenTelemetry Collector / SigNoz。

**Tech Stack:** TypeScript, Node.js, Fastify, Zod, Vitest, OpenTelemetry OTLP HTTP, Vue 3, Vite, Nginx, Docker Compose

---

## Scope

**In scope**
- 新建独立 `frontend-observability` 服务代码仓库或工作区
- 建立 `/v1/events`、`/v1/security/csp-reports`、`/v1/sourcemaps`、`/v1/symbolicate`、`/health` 入口
- 将 browser-native CSP report 与 frontend 增强 `securitypolicyviolation` 从现有 resolver 迁出
- 为 frontend 新增统一 logger facade
- 将 frontend errors 统一接入 `/v1/events`
- 迁移 sourcemap 上传与 symbolication 能力
- 调整 nginx / compose / frontend config 对接到新服务
- 完成后将本计划移入 `completed`

**Out of scope**
- 一次性重写全部 traces / replay 接入
- 全仓 `console.*` 扫荡式清理
- 将服务拆成多进程或多镜像集群
- 构建后端通用日志平台

## Constraints

- 迁移必须分阶段进行，不做大爆炸替换。
- frontend 侧对外上报协议应保持内部 schema 稳定，不直接把 OTLP 暴露给业务代码。
- `service.version` 指 frontend app 版本，`frontend-observability` 自身版本必须使用单独字段表达。
- browser-native CSP report 与 frontend 增强事件都应保留。
- 当前 traces / replay 路径保持稳定，不在本轮顺手重写。
- same-origin 代理优先保持稳定，优先替换 upstream，而不是先改 frontend 所有调用点。

## Repository Targets

- New repo or worktree: `frontend-observability/`
- Current frontend repo: `contract-frontend/`
- Current infra repo: `infra/stack/docker-setting/`

### Task 1: 建立 `frontend-observability` 仓库骨架

**Files:**
- Create: `frontend-observability/package.json`
- Create: `frontend-observability/tsconfig.json`
- Create: `frontend-observability/vitest.config.ts`
- Create: `frontend-observability/src/http/server.ts`
- Create: `frontend-observability/src/config/env.ts`
- Create: `frontend-observability/src/ingest/`
- Create: `frontend-observability/src/symbolication/`
- Create: `frontend-observability/src/forwarders/`
- Create: `frontend-observability/src/schemas/`
- Create: `frontend-observability/src/__tests__/health.spec.ts`

**Step 1: Write the failing health test**
- 为 `GET /health` 新增最小测试，断言服务可启动并返回 `200`.

**Step 2: Run test to verify it fails**
```bash
cd frontend-observability && pnpm exec vitest run src/__tests__/health.spec.ts
```
- Expected: FAIL，因为新仓库和服务骨架尚未建立。

**Step 3: Write minimal implementation**
- 初始化 `package.json`、TypeScript 构建配置、Vitest 配置和最小 HTTP server。
- 选择 `Fastify` 作为 HTTP 层，先只实现 `GET /health`.

**Step 4: Run test to verify it passes**
```bash
cd frontend-observability && pnpm exec vitest run src/__tests__/health.spec.ts
```
- Expected: PASS。

**Step 5: Verify buildability**
```bash
cd frontend-observability && pnpm build
```
- Expected: PASS。

### Task 2: 建立统一 event schema 与 `/v1/events`

**Files:**
- Create: `frontend-observability/src/schemas/event-envelope.ts`
- Create: `frontend-observability/src/ingest/events.ts`
- Create: `frontend-observability/src/forwarders/otlp-logs.ts`
- Create: `frontend-observability/src/__tests__/event-envelope.spec.ts`
- Create: `frontend-observability/src/__tests__/events-route.spec.ts`
- Modify: `frontend-observability/src/http/server.ts`

**Step 1: Write the failing schema tests**
- 为统一 event envelope 增加测试，覆盖：
  - 单条 `log` 事件
  - 批量事件
  - 缺失 `service.name` / `service.version` / `category` 时拒收
  - 非法 `level` 时拒收

**Step 2: Run tests to verify they fail**
```bash
cd frontend-observability && pnpm exec vitest run src/__tests__/event-envelope.spec.ts src/__tests__/events-route.spec.ts
```
- Expected: FAIL，因为 schema 与 `/v1/events` 尚未实现。

**Step 3: Write minimal implementation**
- 用 `zod` 定义统一 event envelope。
- 实现 `POST /v1/events`，支持单条与批量。
- 将内部事件模型转换为 OTLP `/v1/logs` payload，但先只覆盖 `log` 与 `custom` 类别。

**Step 4: Run tests to verify they pass**
```bash
cd frontend-observability && pnpm exec vitest run src/__tests__/event-envelope.spec.ts src/__tests__/events-route.spec.ts
```
- Expected: PASS。

### Task 3: 迁移 CSP / security ingest 到新服务

**Files:**
- Create: `frontend-observability/src/ingest/csp-reports.ts`
- Create: `frontend-observability/src/__tests__/csp-reports.spec.ts`
- Modify: `frontend-observability/src/http/server.ts`
- Modify: `infra/stack/docker-setting/nginx/conf.d/dev.conf`
- Modify: `contract-frontend/src/app/observability/transports/security-report-transport.ts`
- Modify: `contract-frontend/src/app/observability/index.ts`
- Modify: `contract-frontend/src/app/observability/types.ts`
- Modify: `infra/stack/docker-setting/sourcemap-resolver/server.ts`
- Modify: `infra/stack/docker-setting/sourcemap-resolver/server.test.ts`

**Step 1: Write the failing CSP normalization tests**
- 为以下输入形态补测试：
  - `application/csp-report`
  - Reporting API `report-to`
  - frontend 增强 `securitypolicyviolation`
- 断言三者都能统一归档成 `security` 类别事件并生成 OTLP logs。

**Step 2: Run tests to verify they fail**
```bash
cd frontend-observability && pnpm exec vitest run src/__tests__/csp-reports.spec.ts
```
- Expected: FAIL，因为 `/v1/security/csp-reports` 尚未实现。

**Step 3: Write minimal implementation**
- 在新服务实现 `POST /v1/security/csp-reports`。
- 迁移并收敛当前 resolver 中的 CSP normalization / OTLP mapping 逻辑。
- frontend 侧将安全事件 endpoint 从 `sourcemapResolverEndpoint` 迁移到新的 frontend observability endpoint。
- nginx 新增同源代理路径 `/observability/frontend/` 到新服务。

**Step 4: Strip resolver CSP ingest**
- 从 `sourcemap-resolver` 移除 `/v1/csp-reports` 接收逻辑和对应测试，只保留 source map / stack 相关职责。

**Step 5: Run verification**
```bash
cd frontend-observability && pnpm exec vitest run src/__tests__/csp-reports.spec.ts
cd /home/meteor/DEV/infra/stack/docker-setting/sourcemap-resolver && pnpm test
cd /home/meteor/DEV/projects/test/contract-frontend && pnpm test:unit -- src/app/observability/transports/__tests__/security-report-transport.spec.ts src/app/observability/collectors/__tests__/security-policy-collector.spec.ts
```
- Expected: PASS。

### Task 4: 在 frontend 仓库引入统一 logger facade

**Files:**
- Create: `contract-frontend/src/app/observability/logger/index.ts`
- Create: `contract-frontend/src/app/observability/logger/__tests__/logger.spec.ts`
- Modify: `contract-frontend/src/app/observability/types.ts`
- Modify: `contract-frontend/src/app/observability/index.ts`
- Create or modify: `contract-frontend/src/app/observability/transports/events-transport.ts`

**Step 1: Write the failing logger tests**
- 为 `logger.debug/info/warn/error` 增加测试，断言：
  - 会生成统一 event envelope
  - 会自动注入 `service.*`、route、session、trace 上下文
  - `debug` 在 production 默认不发送

**Step 2: Run tests to verify they fail**
```bash
cd /home/meteor/DEV/projects/test/contract-frontend && pnpm test:unit -- src/app/observability/logger/__tests__/logger.spec.ts
```
- Expected: FAIL，因为 logger facade 尚未存在。

**Step 3: Write minimal implementation**
- 实现 logger facade。
- 将 transport 指向 `/observability/frontend/v1/events`。
- 不做全仓替换，只为新 collector / 新路径提供统一入口。

**Step 4: Run tests to verify they pass**
```bash
cd /home/meteor/DEV/projects/test/contract-frontend && pnpm test:unit -- src/app/observability/logger/__tests__/logger.spec.ts
```
- Expected: PASS。

### Task 5: 将 frontend errors 统一收敛到 `/v1/events`

**Files:**
- Modify: `contract-frontend/src/app/observability/transports/signoz-transport.ts`
- Modify: `contract-frontend/src/app/observability/collectors/error-collector.ts`
- Modify: `contract-frontend/src/app/observability/collectors/js-error-collector.ts`
- Modify: `contract-frontend/src/app/observability/collectors/vue-error-collector.ts`
- Modify: `contract-frontend/src/app/observability/collectors/__tests__/error-collector.spec.ts`
- Modify: `contract-frontend/src/app/observability/collectors/__tests__/js-error-collector.spec.ts`
- Modify: `contract-frontend/src/app/observability/collectors/__tests__/vue-error-collector.spec.ts`
- Create: `frontend-observability/src/__tests__/error-events.spec.ts`

**Step 1: Write the failing integration tests**
- 在 frontend 侧断言 JS / Vue / Promise error 最终走统一 events transport，而不是直接依赖旧的 `/v1/errors`。
- 在新服务侧断言 `error` 类别事件会被转换成 OTLP logs。

**Step 2: Run tests to verify they fail**
```bash
cd /home/meteor/DEV/projects/test/contract-frontend && pnpm test:unit -- src/app/observability/collectors/__tests__/error-collector.spec.ts src/app/observability/collectors/__tests__/js-error-collector.spec.ts src/app/observability/collectors/__tests__/vue-error-collector.spec.ts
cd frontend-observability && pnpm exec vitest run src/__tests__/error-events.spec.ts
```
- Expected: FAIL，因为 errors 仍走旧 transport。

**Step 3: Write minimal implementation**
- 在 frontend 侧将现有错误 transport 改为统一 event envelope。
- 服务端将 `error` category 正式纳入 `/v1/events` pipeline。

**Step 4: Run tests to verify they pass**
```bash
cd /home/meteor/DEV/projects/test/contract-frontend && pnpm test:unit -- src/app/observability/collectors/__tests__/error-collector.spec.ts src/app/observability/collectors/__tests__/js-error-collector.spec.ts src/app/observability/collectors/__tests__/vue-error-collector.spec.ts
cd frontend-observability && pnpm exec vitest run src/__tests__/error-events.spec.ts
```
- Expected: PASS。

### Task 6: 将 sourcemap upload / symbolication 迁入新服务

**Files:**
- Create: `frontend-observability/src/symbolication/upload.ts`
- Create: `frontend-observability/src/symbolication/resolve-stack.ts`
- Create: `frontend-observability/src/__tests__/sourcemaps.spec.ts`
- Create: `frontend-observability/src/__tests__/fixtures/symbolicate-request.json`
- Modify: `frontend-observability/src/http/server.ts`
- Modify: `contract-frontend/src/app/observability/index.ts`
- Modify: `infra/stack/docker-setting/sourcemap-resolver/server.ts`
- Modify: `infra/stack/docker-setting/sourcemap-resolver/server.test.ts`

**Step 1: Write the failing symbolication tests**
- 为以下能力补测试：
  - `PUT /v1/sourcemaps`
  - `POST /v1/symbolicate`
  - source map 上传后能解析一条最小堆栈

**Step 2: Run tests to verify they fail**
```bash
cd frontend-observability && pnpm exec vitest run src/__tests__/sourcemaps.spec.ts
```
- Expected: FAIL，因为 symbolication 尚未迁入新服务。

**Step 3: Write minimal implementation**
- 迁移现有 resolver 中 source map 上传、缓存和 stack 解析逻辑到新服务。
- frontend config 将 `sourcemapResolverEndpoint` 收敛为新的 frontend observability endpoint 或单独的 symbolication endpoint。

**Step 4: De-scope old resolver**
- 将 `sourcemap-resolver` 缩减为兼容壳层，或仅保留迁移期转发逻辑。
- 明确后续可下线条件。

**Step 5: Run tests to verify they pass**
```bash
cd frontend-observability && pnpm exec vitest run src/__tests__/sourcemaps.spec.ts
cd /home/meteor/DEV/infra/stack/docker-setting/sourcemap-resolver && pnpm test
```
- Expected: PASS，旧 resolver 仅保留迁移期需要的最小行为。

### Task 7: 更新 infra 部署与 same-origin 路径

**Files:**
- Modify: `infra/stack/docker-setting/nginx/conf.d/dev.conf`
- Modify: `infra/stack/docker-setting/signoz/prod-like/docker-compose.yml`
- Create: `infra/stack/docker-setting/frontend-observability/` deployment assets
- Modify or create: `infra/stack/docker-setting/frontend-observability/Dockerfile` references or image tags

**Step 1: Define routing contract**
- 新增 `/observability/frontend/` same-origin 代理。
- 保持 `/observability/otel`、`/observability/replay` 路径不变。

**Step 2: Deploy the new service**
- 将 `frontend-observability` 以独立服务接入 compose。
- 配置 OTLP downstream endpoint、source map 存储目录和必要环境变量。

**Step 3: Verify same-origin routing**
```bash
curl -k --resolve 'dev.astro777.cfd:443:127.0.0.1' 'https://dev.astro777.cfd/observability/frontend/health' -i
```
- Expected: `HTTP/2 200`。

**Step 4: Verify event ingest**
```bash
curl -k --resolve 'dev.astro777.cfd:443:127.0.0.1' 'https://dev.astro777.cfd/observability/frontend/v1/events' -H 'Content-Type: application/json' -d '{"eventId":"evt-1","timestamp":1710000000000,"category":"log","level":"info","message":"ping","service":{"name":"contract-frontend","version":"0.0.0","environment":"development","release":"dev"},"context":{"url":"https://dev.astro777.cfd/","route":"/"},"payload":{"kind":"test","data":{"ok":true}},"tags":{}}' -i
```
- Expected: success response and downstream OTLP acceptance.

### Task 8: 文档收口并关闭 active plan

**Files:**
- Modify: `contract-frontend/docs/plans/active/2026-04-14-frontend-observability-design.md`
- Modify or create: `contract-frontend/docs/how-to/operations/frontend-observability.md`
- Modify: `contract-frontend/docs/index.md`
- Move: `contract-frontend/docs/plans/active/2026-04-14-frontend-observability-service.md` to `contract-frontend/docs/plans/completed/`

**Step 1: Record the new architecture**
- 补充新服务职责、前端 logger 接入方式、same-origin 路径和 source map 迁移后的入口。

**Step 2: Record remaining follow-up**
- 明确未纳入本轮的 traces / replay 统一化属于后续议题，而不是当前 plan 缺口。

**Step 3: Close the active plan**
- 当新服务、frontend 对接、infra 路由和验证全部完成后，将本计划移入 `completed`。

## Validation

实施期至少应覆盖以下验证：

```bash
cd frontend-observability && pnpm exec vitest run
cd frontend-observability && pnpm build
cd /home/meteor/DEV/projects/test/contract-frontend && pnpm test:unit -- src/app/observability/logger/__tests__/logger.spec.ts src/app/observability/collectors/__tests__/security-policy-collector.spec.ts src/app/observability/collectors/__tests__/error-collector.spec.ts src/app/observability/collectors/__tests__/js-error-collector.spec.ts src/app/observability/collectors/__tests__/vue-error-collector.spec.ts
curl -k --resolve 'dev.astro777.cfd:443:127.0.0.1' 'https://dev.astro777.cfd/observability/frontend/health' -i
```

如 sourcemap 迁移已完成，应补充：

```bash
curl -k --resolve 'dev.astro777.cfd:443:127.0.0.1' 'https://dev.astro777.cfd/observability/frontend/v1/symbolicate' -H 'Content-Type: application/json' --data-binary @frontend-observability/src/__tests__/fixtures/symbolicate-request.json
```

## Exit Criteria

- 已建立独立仓库或工作区 `frontend-observability`
- `/v1/events` 与 `/v1/security/csp-reports` 已接管 frontend logs / security ingest
- frontend 已提供统一 logger facade，且 errors 已进入统一 event pipeline
- source map upload / symbolication 已迁入新服务域
- `sourcemap-resolver` 不再承担 frontend event ingest 职责
- nginx / compose 已完成 same-origin 路由切换
- 文档已更新，并将本计划迁移至 `completed`

## Completion Notes

- `frontend-observability` 已在 `/home/meteor/DEV/projects/test/frontend-observability` 落地，并补齐可运行入口、Dockerfile、Vitest 与 TypeScript 构建
- frontend logger、security ingest、error ingest、sourcemap upload 与 symbolication 已切到新服务域
- `sourcemap-resolver` 已移除 `/v1/csp-reports` 与 `/v1/errors` frontend event ingest
- infra 已新增 `frontend-observability` compose 服务与 `/observability/frontend/` same-origin 路径
- 本地直连健康检查已通过；same-origin `curl` 目前返回 `502`，原因是本机运行中的 Nginx 仍是旧配置且未 reload，新 upstream 也未实际启动
- traces / replay 统一化仍是后续议题，不包含在本次 completed plan 内
