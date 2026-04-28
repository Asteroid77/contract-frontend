Status: completed
Owner: frontend
Last verified: 2026-04-16
Source of truth: yes

# Observability Compose Tiering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `signoz/prod-like` 实现为“一套 base compose + 多个档位 env + core/frontend profiles”的可执行部署结构，并补齐标准启动命令、验证命令和本地运维脚本。

**Architecture:** 保留 `/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/docker-compose.yml` 作为唯一拓扑真源，使用 Docker Compose 的多 `--env-file` 机制先加载共性变量，再加载 `small / medium / large` 档位变量。`core` 与 `frontend` 继续只负责组件范围，档位只负责资源上限；`OpenReplay` 维持可运行评估栈，不纳入本轮默认生产启动路径。

**Tech Stack:** Docker Compose v2、SigNoz Docker Standalone、ClickHouse、pnpm、Markdown 文档

## Completion Summary (2026-04-20)

- `signoz/prod-like` 已收敛为单一 base compose + `envs/small|medium|large.env` + `core/frontend` profiles` 的分层结构。
- 标准化运维脚本已写入 `package.json`，并与 observability 操作文档对齐。
- 本计划与关联 design 已从 `docs/plans/active/` 迁入 `docs/plans/completed/`。
- 验证边界：已完成仓库内文件落库核对，以及 `docker compose --env-file .env.example --env-file envs/small.env --profile core config -q` 静态校验；本次 completed 留痕不重复声明每一次历史运行态 smoke 结果。

## Related Design

- `/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-16-observability-compose-tiering-design.md`

## File Structure

- Modify: `/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/.env.example`
  - 只保留共性变量，不再承载档位内存值
- Create: `/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/envs/small.env`
  - `8C16G` 默认档变量
- Create: `/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/envs/medium.env`
  - `16C32G` 中档变量
- Create: `/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/envs/large.env`
  - `32C64G` 大档变量
- Modify: `/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/docker-compose.yml`
  - 将档位变量从 inline default 调整为显式要求，避免 base compose 偷带档位语义
- Modify: `/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/README.md`
  - 收敛为“目录 / 档位 / profile / 启动 / 验证 / 故障排查”六段结构
- Modify: `/home/meteor/DEV/projects/test/contract-frontend/package.json`
  - 增加标准化 `obs:signoz:*` 脚本
- Modify: `/home/meteor/DEV/projects/test/contract-frontend/docs/how-to/operations/frontend-observability.md`
  - 对齐新的启动命令和运维脚本
- Modify: `/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-16-observability-compose-tiering-design.md`
  - 把启动命令细化为多 `--env-file` 的实际实现方式

## Task 1: 新增档位 env 文件并瘦身 `.env.example`

**Files:**
- Create: `/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/envs/small.env`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/envs/medium.env`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/envs/large.env`
- Modify: `/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/.env.example`

- [ ] **Step 1: 先证明档位 env 还不存在**

Run:

```bash
cd "/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like"
docker compose --env-file .env.example --env-file envs/small.env --profile core config -q
```

Expected:

```text
FAIL，报错类似：Couldn't find env file: .../envs/small.env
```

- [ ] **Step 2: 创建 `small.env`**

```dotenv
SIGNOZ_CLICKHOUSE_MEM_LIMIT=4g
SIGNOZ_API_MEM_LIMIT=1g
SIGNOZ_COLLECTOR_MEM_LIMIT=1g
SOURCEMAP_RESOLVER_MEM_LIMIT=256m
FRONTEND_OBSERVABILITY_MEM_LIMIT=256m
```

- [ ] **Step 3: 创建 `medium.env`**

```dotenv
SIGNOZ_CLICKHOUSE_MEM_LIMIT=8g
SIGNOZ_API_MEM_LIMIT=2g
SIGNOZ_COLLECTOR_MEM_LIMIT=2g
SOURCEMAP_RESOLVER_MEM_LIMIT=512m
FRONTEND_OBSERVABILITY_MEM_LIMIT=512m
```

- [ ] **Step 4: 创建 `large.env`**

```dotenv
SIGNOZ_CLICKHOUSE_MEM_LIMIT=16g
SIGNOZ_API_MEM_LIMIT=4g
SIGNOZ_COLLECTOR_MEM_LIMIT=4g
SOURCEMAP_RESOLVER_MEM_LIMIT=512m
FRONTEND_OBSERVABILITY_MEM_LIMIT=1g
```

- [ ] **Step 5: 瘦身 `.env.example`，移除档位变量**

把当前文件改成下面这版：

```dotenv
# SigNoz 版本
SIGNOZ_VERSION=v0.110.1
SIGNOZ_OTELCOL_TAG=v0.129.13
CLICKHOUSE_VERSION=25.5.6
SIGNOZ_REPO_RAW_TAG=v0.110.1

# 端口
SIGNOZ_UI_PORT=8080
OTLP_GRPC_PORT=4317
OTLP_HTTP_PORT=4318
SOURCEMAP_RESOLVER_PORT=3001
FRONTEND_OBSERVABILITY_PORT=3002

# Collector / resolver 行为
LOW_CARDINAL_EXCEPTION_GROUPING=false
OTEL_COLLECTOR_RESOURCE_ATTRIBUTES=host.name=signoz-host,os.type=linux
SOURCEMAP_OTEL_ENDPOINT=http://otel-collector:4318
SOURCEMAP_SERVICE_NAME=contract-frontend
FRONTEND_OBSERVABILITY_OTLP_LOGS_ENDPOINT=http://otel-collector:4318/v1/logs
FRONTEND_OBSERVABILITY_FRONTEND_SERVICE_NAME=contract-frontend
FRONTEND_OBSERVABILITY_FRONTEND_SERVICE_VERSION=0.0.0
FRONTEND_OBSERVABILITY_FRONTEND_ENVIRONMENT=development
FRONTEND_OBSERVABILITY_FRONTEND_RELEASE=dev
FRONTEND_OBSERVABILITY_SERVICE_NAME=frontend-observability
FRONTEND_OBSERVABILITY_VERSION=0.0.0
```

- [ ] **Step 6: 运行静态校验，确认 merged env 可解析**

Run:

```bash
cd "/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like"
docker compose --env-file .env.example --env-file envs/small.env --profile core config -q
docker compose --env-file .env.example --env-file envs/medium.env --profile core config -q
docker compose --env-file .env.example --env-file envs/large.env --profile core config -q
```

Expected:

```text
PASS，无输出并返回 0
```

## Task 2: 收紧 compose 对档位变量的依赖，并重写 `README`

**Files:**
- Modify: `/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/docker-compose.yml`
- Modify: `/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/README.md`

- [ ] **Step 1: 先确认当前 compose 仍在使用 inline default 档位值**

Run:

```bash
rg -n '\$\{SIGNOZ_CLICKHOUSE_MEM_LIMIT:-4g\}|\$\{SIGNOZ_API_MEM_LIMIT:-1g\}|\$\{SIGNOZ_COLLECTOR_MEM_LIMIT:-1g\}|\$\{SOURCEMAP_RESOLVER_MEM_LIMIT:-256m\}|\$\{FRONTEND_OBSERVABILITY_MEM_LIMIT:-256m\}' "/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/docker-compose.yml"
```

Expected:

```text
PASS，能匹配出 5 条 mem_limit 默认值
```

- [ ] **Step 2: 把 `mem_limit` 从 inline default 改成显式要求**

将相关片段改为：

```yaml
    mem_limit: ${SIGNOZ_CLICKHOUSE_MEM_LIMIT:?load envs/<tier>.env}
```

```yaml
    mem_limit: ${SIGNOZ_API_MEM_LIMIT:?load envs/<tier>.env}
```

```yaml
    mem_limit: ${SIGNOZ_COLLECTOR_MEM_LIMIT:?load envs/<tier>.env}
```

```yaml
    mem_limit: ${SOURCEMAP_RESOLVER_MEM_LIMIT:?load envs/<tier>.env}
```

```yaml
    mem_limit: ${FRONTEND_OBSERVABILITY_MEM_LIMIT:?load envs/<tier>.env}
```

目的：

- base compose 不再偷偷绑定 `small` 档
- 如果忘记加载档位 env，`docker compose config` 直接失败

- [ ] **Step 3: 重写 `README.md` 的启动与验证部分**

把启动矩阵统一成多 `--env-file` 形式，并把 `frontend` profile 描述改成同时包含 `sourcemap-resolver` 和 `frontend-observability`。关键片段应类似：

```md
## 1) 档位

- `envs/small.env`: 8C16G 默认档
- `envs/medium.env`: 16C32G
- `envs/large.env`: 32C64G+

## 2) Profiles

### `core`

- `clickhouse`
- `schema-migrator-sync`
- `schema-migrator-async`
- `signoz`
- `otel-collector`

### `frontend`

- `sourcemap-resolver`
- `frontend-observability`

## 3) 启动

```bash
docker compose --env-file .env.example --env-file envs/small.env --profile core up -d
docker compose --env-file .env.example --env-file envs/small.env --profile core --profile frontend up -d
```
```

- [ ] **Step 4: 验证 `config -q` 在忘记档位 env 时会失败，在带档位 env 时会通过**

Run:

```bash
cd "/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like"
docker compose --env-file .env.example --profile core config -q
docker compose --env-file .env.example --env-file envs/small.env --profile core config -q
docker compose --env-file .env.example --env-file envs/small.env --profile core --profile frontend config -q
```

Expected:

```text
第 1 条 FAIL，报缺少 SIGNOZ_*_MEM_LIMIT
第 2 条 PASS
第 3 条 PASS
```

## Task 3: 在 `package.json` 中固化标准运维命令

**Files:**
- Modify: `/home/meteor/DEV/projects/test/contract-frontend/package.json`

- [ ] **Step 1: 先证明脚本还不存在**

Run:

```bash
cd "/home/meteor/DEV/projects/test/contract-frontend"
pnpm run obs:signoz:config:small
```

Expected:

```text
FAIL，报错类似：ERR_PNPM_NO_SCRIPT Missing script: obs:signoz:config:small
```

- [ ] **Step 2: 在 `package.json` 新增标准脚本**

在 `scripts` 中加入：

```json
{
  "obs:signoz:config:small": "cd /home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like && docker compose --env-file .env.example --env-file envs/small.env --profile core config -q",
  "obs:signoz:config:medium": "cd /home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like && docker compose --env-file .env.example --env-file envs/medium.env --profile core config -q",
  "obs:signoz:config:large": "cd /home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like && docker compose --env-file .env.example --env-file envs/large.env --profile core config -q",
  "obs:signoz:up:small": "cd /home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like && docker compose --env-file .env.example --env-file envs/small.env --profile core up -d",
  "obs:signoz:up:small:frontend": "cd /home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like && docker compose --env-file .env.example --env-file envs/small.env --profile core --profile frontend up -d",
  "obs:signoz:check:small": "cd /home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like && docker compose --env-file .env.example --env-file envs/small.env --profile core ps && curl -fsS http://127.0.0.1:8080/api/v1/health",
  "obs:signoz:logs": "cd /home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like && docker compose logs --tail 200 clickhouse signoz otel-collector"
}
```

- [ ] **Step 3: 运行静态脚本，确认三档都能过配置校验**

Run:

```bash
cd "/home/meteor/DEV/projects/test/contract-frontend"
pnpm run obs:signoz:config:small
pnpm run obs:signoz:config:medium
pnpm run obs:signoz:config:large
```

Expected:

```text
PASS，三个脚本都返回 0
```

## Task 4: 同步仓库运维文档到实际命令

**Files:**
- Modify: `/home/meteor/DEV/projects/test/contract-frontend/docs/how-to/operations/frontend-observability.md`
- Modify: `/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-16-observability-compose-tiering-design.md`

- [ ] **Step 1: 先定位旧命令和不完整说明**

Run:

```bash
rg -n "docker compose --profile core up -d|docker compose --profile core --profile frontend up -d|frontend 只包含 sourcemap-resolver|single env-file" "/home/meteor/DEV/projects/test/contract-frontend/docs/how-to/operations/frontend-observability.md" "/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-16-observability-compose-tiering-design.md"
```

Expected:

```text
至少匹配出需要替换的旧命令或旧表述
```

- [ ] **Step 2: 更新 `frontend-observability.md` 的 Infra 与验证命令**

将关键描述改成下面这类文本：

```md
- 档位 env：`/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/envs/*.env`
- 标准本地脚本：
  - `pnpm run obs:signoz:config:small`
  - `pnpm run obs:signoz:up:small`
  - `pnpm run obs:signoz:up:small:frontend`
  - `pnpm run obs:signoz:check:small`
```

- [ ] **Step 3: 更新设计文档中的启动命令实现细节**

把启动示例从单个 `--env-file envs/small.env` 调整成多 env 文件合并方式：

```md
docker compose --env-file .env.example --env-file envs/small.env --profile core up -d
docker compose --env-file .env.example --env-file envs/small.env --profile core --profile frontend up -d
```

并补一句依据：

```md
Docker Compose 支持多个 `--env-file`，按顺序加载，后面的文件覆盖前面的同名变量。
```

- [ ] **Step 4: 搜索残留旧命令，确认文档已统一**

Run:

```bash
rg -n "docker compose --profile core up -d|docker compose --profile core --profile frontend up -d" "/home/meteor/DEV/projects/test/contract-frontend/docs" "/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like/README.md"
```

Expected:

```text
只允许保留在历史文档中；当前 source-of-truth 文档不应再出现旧命令
```

## Task 5: 运行小档位 smoke，确认 `core` 与 `frontend` 路径都可执行

**Files:**
- Runtime only: `/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like`

- [ ] **Step 1: 启动 `small + core`**

Run:

```bash
cd "/home/meteor/DEV/infra/stack/docker-setting/signoz/prod-like"
docker compose --env-file .env.example --env-file envs/small.env --profile core up -d
docker compose --env-file .env.example --env-file envs/small.env --profile core ps
```

Expected:

```text
`clickhouse`、`signoz`、`otel-collector` 处于 Up/healthy
```

- [ ] **Step 2: 验证小档核心健康**

Run:

```bash
curl -fsS "http://127.0.0.1:8080/api/v1/health"
ss -ltnp | rg ':4318\\b'
```

Expected:

```text
curl 返回 {"status":"ok"} 或等价健康响应
4318 处于监听状态
```

- [ ] **Step 3: 启动 `small + frontend`**

Run:

```bash
docker compose --env-file .env.example --env-file envs/small.env --profile core --profile frontend up -d
docker compose --env-file .env.example --env-file envs/small.env --profile core --profile frontend ps
```

Expected:

```text
`sourcemap-resolver` 与 `frontend-observability` 进入 Up/healthy
```

- [ ] **Step 4: 验证前端辅助服务健康**

Run:

```bash
curl -fsS "http://127.0.0.1:3001/health"
curl -fsS "http://127.0.0.1:3002/health"
```

Expected:

```text
两个健康接口都返回 200
```

## Self-Review

### Spec coverage

- 单一 `docker-compose.yml` + 多档 env：Task 1、Task 2
- `core / frontend` 职责边界：Task 2、Task 5
- 标准启动与验证命令：Task 2、Task 5
- 本地 package 运维脚本：Task 3
- 文档与现状对齐：Task 4
- `OpenReplay` 保持可选，不进默认路径：设计文档已完成；本实现计划不改其 compose

### Placeholder scan

- 无 `TODO/TBD/implement later`
- 每个任务都包含了明确文件路径、命令和预期结果

### Type consistency

- 档位变量统一使用：
  - `SIGNOZ_CLICKHOUSE_MEM_LIMIT`
  - `SIGNOZ_API_MEM_LIMIT`
  - `SIGNOZ_COLLECTOR_MEM_LIMIT`
  - `SOURCEMAP_RESOLVER_MEM_LIMIT`
  - `FRONTEND_OBSERVABILITY_MEM_LIMIT`
- 标准命令统一使用：
  - `docker compose --env-file .env.example --env-file envs/<tier>.env`
