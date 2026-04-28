Status: completed
Owner: frontend
Last verified: 2026-04-19
Source of truth: yes

# Observability Compose Tiering Design

## 背景

当前 observability 相关部署已经形成两条线：

- `SigNoz prod-like` 承担当前阶段的默认生产观测主路径，负责 traces、metrics、logs，以及 `frontend-observability`、`sourcemap-resolver` 这两个前端辅助服务。
- `OpenReplay prod-like` 已在 VM 上具备可运行能力，可继续作为评估环境保留，但当前阶段不纳入默认生产启动路径。

现状问题不在于功能缺失，而在于部署档位尚未工程化：

- `signoz/prod-like/docker-compose.yml` 目前同时承载拓扑、资源上限和启用范围，缺少明确的档位切换机制。
- `frontend-observability` 与 `sourcemap-resolver` 已经挂在同一套 compose 中，但“机器规格”和“组件启用范围”还没有分层。
- `OpenReplay` 已有 `CLICKHOUSE_PROFILE_FILE` 这类档位思路，但和 `SigNoz` 侧没有形成统一约定。
- 当前文档对 OpenReplay 的描述容易给人“现在就该在生产默认启用”的错误预期。

## 目标

- 将 `SigNoz prod-like` 收敛为“一套 base compose + 多个档位 env”的单一真源结构。
- 将“机器档位”和“组件启用范围”解耦：
  - `env-file` 负责资源档位
  - `profile` 负责启用哪些组件
- 为 `small / medium / large` 三档提供明确默认值与标准启动命令。
- 保持 `frontend-observability` 与 `sourcemap-resolver` 继续作为 `SigNoz` 同栈组件管理。
- 保留 `OpenReplay` 的评估部署，但明确其当前不属于默认生产启动路径。

## 非目标

- 不拆成多份平行维护的 compose 文件。
- 不在本轮重新设计 `OpenReplay` 的 Docker 拓扑或入口路由。
- 不在本轮把 `OpenReplay` 纳入默认生产启用路径。
- 不在本轮引入额外 orchestrator、Helm 或更重的部署编排。

## 外部依据

- Docker Compose 官方文档明确：
  - 可以通过多个 `--env-file` 按顺序加载环境文件，后面的文件覆盖前面的同名变量。
  - `profiles` 用于选择性启用服务；未分配 profile 的服务默认启用，而分配了 profile 的服务只在激活对应 profile 时启动。
- 这直接支持本设计将“档位变量”和“组件启用范围”拆分成两个正交维度：
  - `env-file` 负责机器档位与资源上限
  - `profile` 负责启用哪些组件

## 决策摘要

采用 `方案 A`：

- 保留单一 `docker-compose.yml` 作为拓扑真源。
- 新增 `envs/small.env`、`envs/medium.env`、`envs/large.env`，只承载档位变量。
- 保留 `.env.example`，但只承载环境共性变量与样板值。
- 继续使用 compose `profiles` 控制组件范围。
- 首批实施范围只覆盖：
  - `signoz/prod-like`
  - `frontend-observability`
  - `sourcemap-resolver`
- `openreplay/prod-like` 先保持现状，仅在文档层与命名约定上对齐，不进入默认启动矩阵。

## 采用方案

- 保留单一 `docker-compose.yml` 作为唯一拓扑真源。
- 新增 `envs/small.env`、`envs/medium.env`、`envs/large.env`，只承载档位变量。
- 保留 `.env.example` 作为共性变量样板，不再承载具体机器档位值。
- 保留 `profiles` 控制组件范围，并将 `core / frontend` 的职责固定下来。
- 将标准启动矩阵、标准验证命令和运维脚本全部统一到这套分层模型。

## 架构与职责边界

建议形成如下结构：

- `signoz/prod-like/docker-compose.yml`
  - 唯一拓扑真源
- `signoz/prod-like/.env.example`
  - 共性变量样板
- `signoz/prod-like/envs/small.env`
  - `8C16G` 默认档
- `signoz/prod-like/envs/medium.env`
  - `16C32G` 中档
- `signoz/prod-like/envs/large.env`
  - `32C64G` 及以上档
- `signoz/prod-like/README.md`
  - 标准启动、验证与排障说明

### `docker-compose.yml`

职责只包括：

- 服务拓扑
- `depends_on`
- `profiles`
- network / volume
- healthcheck
- 默认 command / image / build 关系

不在这里硬编码档位差异。

### `.env.example`

职责只包括：

- 镜像版本
- 端口
- 公共路径
- 服务命名
- release / environment 等标签
- 非档位相关的默认项

不在这里放：

- 某一档专属内存上限
- 组件启停开关
- 真实 secret

### `envs/*.env`

职责只包括档位变量，例如：

- `SIGNOZ_CLICKHOUSE_MEM_LIMIT`
- `SIGNOZ_API_MEM_LIMIT`
- `SIGNOZ_COLLECTOR_MEM_LIMIT`
- `SOURCEMAP_RESOLVER_MEM_LIMIT`
- `FRONTEND_OBSERVABILITY_MEM_LIMIT`

后续若要补：

- ClickHouse profile
- 某些可安全参数化的批量大小

也应优先进入 `envs/*.env`。

## Source Of Truth

- 服务拓扑、依赖关系、profiles、healthcheck 的唯一真源是：
  - `signoz/prod-like/docker-compose.yml`
- 共性变量样板的唯一真源是：
  - `signoz/prod-like/.env.example`
- 机器档位与资源上限的唯一真源是：
  - `signoz/prod-like/envs/*.env`
- 标准启动、验证与排障说明的唯一真源是：
  - `signoz/prod-like/README.md`
- `profile` 只允许表达组件范围，`env-file` 只允许表达档位变量；两者不得交叉承担职责。

## Profile 约定

`profile` 只负责“启用哪些组件”，不负责资源档位。

首批固定两类：

- `core`
  - `clickhouse`
  - `schema-migrator-sync`
  - `schema-migrator-async`
  - `signoz`
  - `otel-collector`
- `frontend`
  - `sourcemap-resolver`
  - `frontend-observability`

约束：

- 不允许 `small.env` 通过变量偷偷关闭服务。
- 不允许 `--profile frontend` 顺手改资源上限。
- “档位”和“组件范围”必须始终分离。

## 三档默认值

### `small`

目标机器：

- `8C16G`

默认用途：

- 当前阶段默认生产档
- 低流量生产 / 预生产

推荐默认值：

- `SIGNOZ_CLICKHOUSE_MEM_LIMIT=4g`
- `SIGNOZ_API_MEM_LIMIT=1g`
- `SIGNOZ_COLLECTOR_MEM_LIMIT=1g`
- `SOURCEMAP_RESOLVER_MEM_LIMIT=256m`
- `FRONTEND_OBSERVABILITY_MEM_LIMIT=256m`

### `medium`

目标机器：

- `16C32G`

默认用途：

- 前端基础遥测稳定开启
- 日志与 trace 保留更久

推荐默认值：

- `SIGNOZ_CLICKHOUSE_MEM_LIMIT=8g`
- `SIGNOZ_API_MEM_LIMIT=2g`
- `SIGNOZ_COLLECTOR_MEM_LIMIT=2g`
- `SOURCEMAP_RESOLVER_MEM_LIMIT=512m`
- `FRONTEND_OBSERVABILITY_MEM_LIMIT=512m`

### `large`

目标机器：

- `32C64G` 及以上

默认用途：

- 独立观测节点
- 更长保留期
- 更高写入预期

推荐默认值：

- `SIGNOZ_CLICKHOUSE_MEM_LIMIT=16g`
- `SIGNOZ_API_MEM_LIMIT=4g`
- `SIGNOZ_COLLECTOR_MEM_LIMIT=4g`
- `SOURCEMAP_RESOLVER_MEM_LIMIT=512m`
- `FRONTEND_OBSERVABILITY_MEM_LIMIT=1g`

## 标准启动矩阵

统一采用如下命令风格：

Docker Compose 支持多个 `--env-file`，按顺序加载，后面的文件覆盖前面的同名变量。因此这里统一先加载 `.env.example`，再加载 `envs/<tier>.env`。

```bash
# small 核心观测
docker compose --env-file .env.example --env-file envs/small.env --profile core up -d

# small + 前端辅助
docker compose --env-file .env.example --env-file envs/small.env --profile core --profile frontend up -d

# medium 核心观测
docker compose --env-file .env.example --env-file envs/medium.env --profile core up -d

# large + 前端辅助
docker compose --env-file .env.example --env-file envs/large.env --profile core --profile frontend up -d
```

不再推荐直接裸跑：

```bash
docker compose up -d
```

因为这会丢失当前档位信息。

## README 结构

`signoz/prod-like/README.md` 应固定为以下 6 段：

1. 目录说明
2. 档位说明
3. profile 说明
4. 标准启动命令
5. 标准验证命令
6. 常见故障排查

文档边界：

- “档位说明”只解释资源与 retention
- “profile 说明”只解释启用组件
- 不把 OpenReplay 的默认启用路径混进 `SigNoz` README

## 标准验证命令

建议收敛为：

```bash
docker compose --env-file .env.example --env-file envs/small.env --profile core config -q
docker compose --env-file .env.example --env-file envs/small.env --profile core ps
curl -fsS http://127.0.0.1:${SIGNOZ_UI_PORT:-8080}/api/v1/health
```

带 `frontend` profile 时追加：

```bash
curl -fsS http://127.0.0.1:${SOURCEMAP_RESOLVER_PORT:-3001}/health
curl -fsS http://127.0.0.1:${FRONTEND_OBSERVABILITY_PORT:-3002}/health
```

后续应同步补齐统一脚本命名，例如：

- `pnpm run obs:signoz:config:small`
- `pnpm run obs:signoz:up:small`
- `pnpm run obs:signoz:up:small:frontend`
- `pnpm run obs:signoz:check:small`
- `pnpm run obs:signoz:logs`

## 与 OpenReplay 的边界

当前决策为：

- `OpenReplay` 部署保留
- 继续允许在 VM 上做评估、验证和隐私策略打样
- 当前阶段不把 `OpenReplay` 纳入默认生产启动路径

因此：

- `OpenReplay` 相关文档应明确标注为“可选 / 评估 / 条件启用”
- `frontend-observability` 主文档不再把 replay 表述为当前生产默认主路径
- 任何“生产环境建议默认启用 OpenReplay”的表述都应移除或改为条件启用

## 风险与控制

### 风险 1：档位和 profile 语义混淆

控制：

- `env-file` 只管资源和 retention
- `profile` 只管组件启停
- README 和脚本命名都保持同一语义

### 风险 2：多份 compose 漂移

控制：

- 保持单一 `docker-compose.yml`
- 所有档位只通过 env 覆盖

### 风险 3：OpenReplay 文档继续给出错误预期

控制：

- 明确其当前属于可选评估栈
- 生产默认路径仍以 `SigNoz + frontend-observability` 为主

## 验收标准

- 已新增一份面向 `signoz/prod-like` 的分档设计文档。
- 文档索引已收录该设计。
- `frontend-observability` 运维文档已明确：
  - 当前生产主路径为 `SigNoz + frontend-observability`
  - replay 属于可选评估能力
- `openreplay` 运维文档已明确：
  - 当前默认不启用
  - 仅在满足后续门槛时进入生产
- 相关文档不再出现“生产默认启用 OpenReplay”的冲突表述。

## 与其他文档的关系

- `docs/how-to/operations/frontend-observability.md`
- `docs/how-to/operations/openreplay-setup.md`
- `docs/how-to/operations/clickhouse-internal-logs-sizing.md`
- `docs/plans/completed/2026-04-15-openreplay-prod-like-deployment-design.md`
- `docs/plans/active/2026-04-16-openreplay-frontend-integration-privacy-design.md`

## 参考资料

- https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/
- https://docs.docker.com/compose/how-tos/profiles/
