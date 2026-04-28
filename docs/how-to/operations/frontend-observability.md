Status: active
Owner: frontend
Last verified: 2026-04-16
Source of truth: yes

# Frontend Observability Operations

## 概览

`frontend-observability` 已作为独立服务域承接 frontend logs、errors、security events 以及 sourcemap/symbolication。

- 服务代码：`/home/meteor/DEV/projects/test/frontend-observability`
- 同源入口：`/observability/frontend/`
- Nginx 配置：`/home/meteor/DEV/infra/stack/docker-setting/nginx/conf.d/dev.conf`
- Compose 服务：`frontend-observability-prod-like`

## 对外入口

- `GET /observability/frontend/health`
- `POST /observability/frontend/v1/events`
- `POST /observability/frontend/v1/security/csp-reports`
- `PUT /observability/frontend/v1/sourcemaps`
- `POST /observability/frontend/v1/symbolicate`

## Frontend Release Sourcemaps

Frontend release sourcemaps 是私有构建产物。deployable build 会生成 hidden sourcemap，CI/CD 将 `.map` 上传到 `frontend-observability`，public frontend assets 不对外暴露 `.map`。

Release id 约定：

- main CD：`release=<github.sha>`
- tag release：`release=<git tag>`
- 本地 production-like package：显式传入 `RELEASE_ID`

Identifier 字段分工：

- `service.version`：语义产品版本，用于人工阅读、release notes 和产品口径统计。
- `service.release`：精确 deployable artifact id，是 sourcemap lookup key 的一部分。
- `git.commit`：构建输入 commit，用于审计和代码定位。
- `git.branch`：查询上下文；不能作为 sourcemap lookup key。
- `build.id`：CI run id 或本地 packaging id。
- `release.channel`：发布通道。

上传协议：

```text
PUT /v1/sourcemaps?service=contract-frontend&release=<release>&filename=assets/<file>.js.map
```

存储布局：

```text
SOURCEMAP_DIR/contract-frontend/<release>/assets/<file>.js.map
```

Runtime CSP、error、log payload 必须携带同一个 `service.release`，让 symbolication 使用与用户浏览器实际加载 bundle 匹配的 sourcemap。Resolver lookup key 固定为：

```text
service.name + service.release + source_file
```

不要把 `service.version` 单独作为 lookup key；不要把 `git.branch` 当 release key。`git.commit`、`git.branch`、`build.id`、`release.channel` 只用于 SigNoz 查询上下文。

## Frontend 接入

- logger facade 位于 `src/app/observability/logger/index.ts`
- error collectors 通过 `src/app/observability/transports/signoz-transport.ts` 映射到统一 event envelope
- security collector 通过 `src/app/observability/transports/security-report-transport.ts` 发送到 `/v1/security/csp-reports`
- security collector 不在前端丢弃 development CSP violation；已知 dev 噪音应进入 SigNoz 后通过查询条件或看板过滤，避免破坏 CSP 事件对账与可追溯性。
- `src/app/observability/index.ts` 默认将 `frontendObservabilityEndpoint` 解析为 `/observability/frontend`
- `sourcemapResolverEndpoint` 在迁移期默认回落到 `/observability/frontend`，避免继续依赖旧 resolver

## CSP violation anti-storm fields

The frontend collector keeps the first detailed CSP violation reports for each short-window fingerprint and emits a duplicate summary when repeated events exceed the local cap.

Dashboard filters should still filter dev-only noise at query time rather than dropping events in the frontend collector:

```text
attribute.security.type = 'csp'
AND resource.service.name = 'contract-frontend'
```

Useful grouping fields:

```text
attribute.csp.report_kind
attribute.csp.fingerprint
attribute.csp.effective_directive
attribute.csp.source_file
attribute.csp.blocked_uri
resource.service.release
```

Useful count fields:

```text
attribute.csp.occurrence_count
attribute.csp.suppressed_duplicate_count
```

## Infra 接入

- compose 文件：`/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/docker-compose.yml`
- 环境变量样例：`/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/.env.example`
- 档位 env：`/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/envs/*.env`
- 部署说明：`/home/meteor/DEV/infra/stack/docker-setting/frontend-observability/README.md`
- 分档设计：`docs/plans/completed/2026-04-16-observability-compose-tiering-design.md`
- ClickHouse 内部日志与机器规格指引：`docs/how-to/operations/clickhouse-internal-logs-sizing.md`
- sourcemap 共享卷：`../../sourcemap-data:/app/sourcemaps`
- 标准本地脚本：
  - `pnpm run obs:signoz:config:small`
  - `pnpm run obs:signoz:up:small`
  - `pnpm run obs:signoz:up:small:frontend`
  - `pnpm run obs:signoz:check:small`
  - `pnpm run obs:signoz:logs`

## 验证命令

```bash
cd /home/meteor/DEV/projects/test/frontend-observability && pnpm exec vitest run
cd /home/meteor/DEV/projects/test/frontend-observability && pnpm build
cd /home/meteor/DEV/projects/test/contract-frontend && pnpm test:unit --run src/app/observability/logger/__tests__/logger.spec.ts src/app/observability/collectors/__tests__/security-policy-collector.spec.ts src/app/observability/collectors/__tests__/error-collector.spec.ts src/app/observability/collectors/__tests__/js-error-collector.spec.ts src/app/observability/collectors/__tests__/vue-error-collector.spec.ts src/app/observability/transports/__tests__/signoz-transport.spec.ts src/app/observability/__tests__/index.spec.ts
cd /home/meteor/DEV/infra/stack/docker-setting/sourcemap-resolver && pnpm test
cd /home/meteor/DEV/projects/test/contract-frontend && pnpm run obs:signoz:config:small
cd /home/meteor/DEV/projects/test/contract-frontend && pnpm run obs:signoz:check:small
```

需要拉起 `small` 档时，统一使用仓库脚本：

```bash
cd /home/meteor/DEV/projects/test/contract-frontend && pnpm run obs:signoz:up:small
cd /home/meteor/DEV/projects/test/contract-frontend && pnpm run obs:signoz:up:small:frontend
```

本地单服务可运行性验证：

```bash
cd /home/meteor/DEV/projects/test/frontend-observability && PORT=3101 node dist/index.js
curl -i http://127.0.0.1:3101/health
```

## 当前边界

- traces 现在走 `/observability/frontend/v1/traces`
- 当前生产主路径是 `frontend-observability + traces`；replay 入口仅保留为可选评估链路
- `/observability/otel` 与 `/observability/replay` 仅作为迁移期兼容路径
- OpenReplay 未显式配置 `VITE_OPENREPLAY_INGEST_POINT` 时，frontend 仍会回落到同源 `/observability/frontend/replay`，但当前阶段默认不在生产启用 replay
- 仅当 replay 评估链路被显式打开时，才需要检查 OpenReplay ingest 的 `502`
- 同源 `curl` 返回 `502` 时，优先检查 Nginx 是否已 reload 到最新 `dev.conf`，以及目标 upstream（`frontend-observability`、OTEL Collector，必要时再看 OpenReplay ingest）是否可达
- 旧 `sourcemap-resolver` 已移除 frontend event ingest，只保留迁移期 sourcemap 兼容职责
