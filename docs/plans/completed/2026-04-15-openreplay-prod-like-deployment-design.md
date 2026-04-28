Status: completed
Owner: frontend
Last verified: 2026-04-19
Source of truth: yes

# OpenReplay Prod-Like VM Deployment Design

## 背景

当前 frontend observability 的 trace 已经接通到 VM 上的 OTel Collector：

- `/observability/frontend/v1/traces`
- Nginx -> `192.168.0.113:4318`

但 replay 仍未接通：

- frontend 默认 ingest 入口已经切到 `/observability/frontend/replay`
- 公网站点 Nginx 已经代理 `/observability/frontend/replay` 到 `192.168.0.113:9001`
- 实际运行态返回 `502`

排查结果已经明确：

- VM 上没有 `9001` 监听
- VM 上没有 OpenReplay 容器
- `infra/stack/docker-setting/openreplay/` 当前只有数据目录，没有可部署配置
- OpenReplay 官方 Docker Compose 的外部 replay ingest 语义是 `/ingest/...`
- 官方 `9001` 不是 replay ingest 的固定端口，官方 compose 中该端口与其他服务用途相关

## 目标

- 在 `local-prod-vm` 上补齐一套最小可用的 OpenReplay 部署。
- 保持浏览器侧仍然只访问公网站点同源入口 `/observability/frontend/replay`。
- 让本机公网站点 Nginx 继续把 replay 请求转发到 VM 上的稳定入口 `192.168.0.113:9001`。
- 让公网站点 Nginx 在转发时把外部前缀 `/observability/frontend/replay` 映射到 OpenReplay 官方 `/ingest`。
- 不要求 OpenReplay 自己单独具备公网域名。

## 非目标

- 不给 OpenReplay 单独申请公网域名。
- 不把 OpenReplay UI 并入公网站点域名。
- 不把浏览器配置切回直接访问 VM IP。
- 不重构 frontend replay SDK 行为。
- 不补做与 replay 无关的 observability 能力改造。

## 决策摘要

- 浏览器继续只打公网站点同源入口 `/observability/frontend/replay`。
- 公网站点 Nginx 继续作为唯一外部入口，并负责把该前缀重写到 VM 上 OpenReplay 官方 `/ingest`。
- 在 VM 上新增最小 prod-like OpenReplay 部署，使 `192.168.0.113:9001` 成为外部稳定边界端口，并映射到官方 `nginx-openreplay:80`。
- OpenReplay UI 当前仅要求 VM 内网 / 管理员访问，不并入公网站点。

## 约束

- OpenReplay 不能部署在当前机器，必须部署在 `local-prod-vm`。
- 当前只有 VM 内网 IP：`192.168.0.113`。
- 暂无 OpenReplay 独立域名。
- 外网用户访问的是公网站点，浏览器 replay 数据通过同源路径进入公网站点 Nginx。
- 本轮优先接通 replay ingest，不把 OpenReplay UI 并入公网站点。

## 外部依据

- OpenReplay 官方标准自托管路径假设服务具备公网 IP 与域名。
- SDK `ingestPoint` 的默认语义是直接指向 OpenReplay 服务域名下的 ingest 入口。
- 官方 Docker Compose 的前门是 `nginx-openreplay:80`，`/ingest/...` 再转发到 `http-openreplay:8080`。

这些结论意味着：

- 官方默认不是“公网站点同源代理到内网 OpenReplay”。
- 但在当前没有独立域名的条件下，必须做一层工程化适配：浏览器仍打同源入口，公网站点 Nginx 再转发到 VM 上的 OpenReplay。
- VM 上的 `9001` 应视为我们自定义的稳定边界端口，而不是 OpenReplay 官方 ingest 固定端口。

## 采用方案

### 浏览器入口

- frontend 继续使用 `/observability/frontend/replay`
- 不把 frontend 配置切回 VM IP
- 不要求浏览器直接访问 VM

### 公网站点 Nginx

- 保持 `/observability/frontend/replay`
- 保持 `/observability/frontend/replay/`
- upstream 继续指向 `192.168.0.113:9001`
- 转发时将：
  - `/observability/frontend/replay` -> 上游 `/ingest`
  - `/observability/frontend/replay/...` -> 上游 `/ingest/...`

这里的 `9001` 不是 OpenReplay 官方固定端口，而是我们为 VM 侧 replay 入口约定的稳定边界端口。

### VM 侧部署

在 `infra` 新增：

- `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/docker-compose.yml`
- `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/.env.example`
- `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/README.md`
- `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/nginx.conf`
- `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/clickhouse-config/*`
- `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/clickhouse-profiles/*.xml`
- `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/docker-envs/*.env`
- `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/bootstrap/*`

职责：

- `docker-compose.yml`
  - 定义 OpenReplay 的最小 prod-like 部署
  - 复用 OpenReplay 官方服务拓扑
  - 让 `9001` 对外映射到官方 `nginx-openreplay:80`
- `.env.example`
  - 声明最小环境变量与端口约定
  - 记录 VM 内部访问地址与管理员访问入口
  - 通过 `CLICKHOUSE_PROFILE_FILE` 选择开发/生产不同体量的日志保留模板
- `clickhouse-config/*`
  - 固化 ClickHouse 的低噪声默认项
  - 避免默认 logger 级别过高
- `clickhouse-profiles/*.xml`
  - 以模板方式固化不同环境下的 `query_log` 保留周期
  - 默认关闭 `trace_log`、`metric_log`、`query_metric_log`、`asynchronous_metric_log`、`processors_profile_log`
  - 防止 ClickHouse 内部诊断日志长期失控膨胀
- `nginx.conf`
  - 复用官方 `/ingest`、UI、静态资源等前门路由语义
- `docker-envs/*.env`
  - 为 prod-like 目录固化最小可运行环境变量
  - 将容器内部访问地址与管理员访问地址区分开
- `bootstrap/*`
  - 固化官方 migration 依赖的 MinIO 初始化脚本与数据库 schema 文件
- `README.md`
  - 记录 VM 启停、验证、排障方式

## 架构与职责边界

- 浏览器职责：
  - 只访问公网站点同源 replay 入口
  - 不感知 VM 内网地址
- 公网站点 Nginx 职责：
  - 作为唯一外部入口
  - 负责前缀改写与到 VM 稳定端口的转发
- VM prod-like 部署职责：
  - 承接 OpenReplay 官方前门 `nginx-openreplay:80`
  - 提供 `/ingest/...` 以及内网 UI 访问
- 本轮边界：
  - 只接通 replay ingest
  - 不把 UI 并入公网域名

不采用的方案：

- 不直接把浏览器指到 VM IP，因为外网用户无法直接访问 `192.168.0.113`，且会破坏同源入口策略并增加 CSP / CORS / 安全边界复杂度。
- 不先做 OpenReplay 单独公网域名，因为当前最小阻塞点是 replay ingest 不可用，而单独域名会额外引入 DNS / TLS / 入口治理。

## Source Of Truth

- frontend replay ingest 入口的唯一真源是 frontend runtime 的同源配置，不允许把浏览器配置改成直连 VM。
- 公网站点 replay 前缀到 VM `/ingest` 的映射真源是公网站点 Nginx 配置。
- VM 侧 OpenReplay 部署的真源是：
  - `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/*`
- ClickHouse 内部日志保留策略的真源是：
  - `CLICKHOUSE_PROFILE_FILE`
  - `clickhouse-profiles/*.xml`

## 风险与控制

### 风险 1：OpenReplay 官方 compose 不直接暴露 `9001`

- 风险：
  - 把 `9001` 错当成官方内部固定端口，会导致部署理解和排障方向错误。
- 控制：
  - 把 `9001` 视为 VM 外部稳定入口，而不是官方内部端口约束。
  - 让 `9001` 直接映射到官方 `nginx-openreplay:80`。

### 风险 2：无域名导致 UI / ingress 行为与官方默认路径不同

- 风险：
  - 没有独立域名时，官方默认部署路径和当前入口治理模型不一致。
- 控制：
  - 本轮只保证 replay ingest 经由公网站点同源入口可用。
  - UI 先保留为内网管理员访问或 SSH tunnel 访问。

### 风险 3：公网站点仍按原始前缀转发，未映射到 `/ingest`

- 风险：
  - 只做端口转发、不做路径映射时，replay 仍会失败。
- 控制：
  - 本轮明确把本机 Nginx 的 replay 路由改写到 OpenReplay 官方 `/ingest`。
  - 在 smoke 验证中同时检查无尾斜杠与有尾斜杠路径。

### 风险 4：部署配置缺失导致后续运维不可重复

- 风险：
  - 只把当前环境手工调通，后续无法复现。
- 控制：
  - 在 `infra` 明确补齐 compose、env 示例和 README。
  - 文档写清 VM 侧启动、验证、排障步骤。

### 风险 5：ClickHouse 内部系统日志在低流量环境中异常膨胀

- 风险：
  - 低流量环境下仍可能因为内部日志导致存储异常膨胀。
- 控制：
  - 将 `trace_log`、`metric_log`、`query_metric_log`、`asynchronous_metric_log`、`processors_profile_log` 默认关闭。
  - 用 `CLICKHOUSE_PROFILE_FILE` 区分开发和生产不同体量的 `query_log` TTL。
  - 当前 `8C16G + 240G` 单机默认使用 `prod-small.xml`。

## 验收标准

- VM 上 `ss -ltnp` 能看到 `9001` 监听。
- 公网站点 Nginx 到 `192.168.0.113:9001` 不再 `connection refused`。
- `curl https://dev.astro777.cfd/observability/frontend/replay` 不再返回 `502`。
- `curl http://192.168.0.113:9001/ingest` 在 VM 内网不再连接失败。
- frontend 启用 OpenReplay 后能创建可见 session。

## 与其他文档的关系

- 实施步骤与验证命令见对应 implementation plan：
  - `/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-15-openreplay-prod-like-deployment-plan.md`
- 当前设计只处理 VM prod-like 部署与同源 replay 路由，不重复前端隐私治理设计：
  - `/home/meteor/DEV/projects/test/contract-frontend/docs/plans/active/2026-04-16-openreplay-frontend-integration-privacy-design.md`

## 参考资料

- https://docs.openreplay.com/en/deployment/deploy-docker/
- https://docs.openreplay.com/en/sdk/constructor/
