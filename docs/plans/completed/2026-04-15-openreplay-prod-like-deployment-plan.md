Status: completed
Owner: frontend
Last verified: 2026-04-15
Source of truth: yes

# OpenReplay Prod-Like VM Deployment Implementation Plan

**Goal:** 在 `local-prod-vm` 上补齐最小可用的 OpenReplay 部署，让公网站点同源 replay 入口 `/observability/frontend/replay` 能经由本机 Nginx 正确转发到 VM 上的 replay ingest。

**Architecture:** 浏览器继续只访问公网站点同源入口；本机 Nginx 继续代理到 `192.168.0.113:9001`；在 VM 上补充 OpenReplay prod-like 部署，使 `9001` 成为映射到官方 `nginx-openreplay:80` 的稳定入口；本机 Nginx 再把外部 `/observability/frontend/replay` 重写到上游 `/ingest`。UI 先只要求 VM 内网可访问，不并入公网站点。

**Tech Stack:** Docker Compose、OpenReplay self-hosted stack、Nginx、curl、SSH

## Completion Summary (2026-04-20)

- `openreplay/prod-like` 所需的 compose、env、bootstrap、ClickHouse profile、README 与 Nginx 配置已落入 infra 真源目录。
- VM 侧 prod-like 部署已补齐，replay 通过同源入口接入；UI 仍按设计保留为内网/管理员访问，不并入公网站点。
- 本计划与关联 design 已从 `docs/plans/active/` 迁入 `docs/plans/completed/`。
- 验证边界：已完成仓库内文件落库核对与 `docker compose --env-file .env.example config -q` 静态校验；本次 completed 留痕不重复声明每一次 live runtime smoke 的历史输出。

## Related Design

- `/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-15-openreplay-prod-like-deployment-design.md`

## File Structure

- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/docker-compose.yml`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/.env.example`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/README.md`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/nginx.conf`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/clickhouse-config/*`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/clickhouse-profiles/*.xml`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/docker-envs/*.env`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/bootstrap/*`
- Modify if needed: `/home/meteor/DEV/infra/stack/docker-setting/nginx/conf.d/dev.conf`
- Modify if needed: `/home/meteor/DEV/projects/test/contract-frontend/docs/how-to/operations/openreplay-setup.md`
- Completed location: `/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-15-openreplay-prod-like-deployment-design.md`
- Completed location: `/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-15-openreplay-prod-like-deployment-plan.md`

## Task 1: 固化 OpenReplay VM 部署配置

**Files:**

- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/docker-compose.yml`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/.env.example`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/README.md`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/nginx.conf`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/clickhouse-config/*`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/clickhouse-profiles/*.xml`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/docker-envs/*.env`
- Create: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/bootstrap/*`

- [ ] **Step 1: 先确认当前目录下不存在可复用的完整 prod-like 部署文件**

Run:

```bash
find "/home/meteor/DEV/infra/stack/docker-setting/openreplay" -maxdepth 4 \( -type d -o -type f \) | sort
```

Expected:

```text
当前目录要么只有零散数据目录，要么缺少本计划要求的完整 prod-like 部署文件集。
```

- [ ] **Step 2: 写最小 compose 并校验关键拓扑**

Run:

```bash
rg -n "nginx-openreplay|9001:80|/ingest|../data" \
  "/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/docker-compose.yml"
```

Expected:

```text
compose 明确体现 VM 部署、官方 `nginx-openreplay` 前门、稳定入口 `9001:80`、`/ingest` 入口和对 `../data/*` 的复用。
```

- [ ] **Step 3: 写 `.env.example` 并校验最小运行变量**

Run:

```bash
rg -n "PORT|ORIGIN|CLICKHOUSE_PROFILE_FILE|PASSWORD|TOKEN" \
  "/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/.env.example"
```

Expected:

```text
.env 样板能看出稳定入口端口、管理员访问 origin、容器内部 origin、ClickHouse profile 选择和必要密码 / token 占位说明。
```

- [ ] **Step 4: 补齐 Nginx、docker-envs、ClickHouse profile 与 bootstrap 文件**

Run:

```bash
find "/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like" -maxdepth 3 -type f | sort
```

Expected:

```text
能够看到 `nginx.conf`、`docker-envs/*.env`、`clickhouse-config/*`、`clickhouse-profiles/*.xml` 和 `bootstrap/*` 已齐备。
```

- [ ] **Step 5: 写部署 README 并校验关键章节**

Run:

```bash
rg -n "^# |^## " "/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like/README.md"
```

Expected:

```text
README 至少说明目录定位、VM 启动命令、replay ingest 入口、UI 入口、验证命令和常见故障排查。
```

## Task 2: 在 VM 上启动 OpenReplay

**Files:**

- Runtime only: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like`

- [ ] **Step 1: 把配置同步到 VM 可执行目录**

Run:

```bash
s local-prod-vm "cd /home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like && ls -la"
```

Expected:

```text
VM 上能看到 `docker-compose.yml`、`.env.example`、`README.md` 等可执行部署文件。
```

- [ ] **Step 2: 生成实际环境文件**

Run:

```bash
s local-prod-vm "cd /home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like && [ -f .env ] || cp .env.example .env"
```

Expected:

```text
VM 目录下生成 `.env`，并能作为后续 `docker compose` 的实际环境文件。
```

- [ ] **Step 3: 静态校验 compose**

Run:

```bash
s local-prod-vm "cd /home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like && docker compose config -q"
```

Expected:

```text
静态校验返回 0，说明 compose 与环境变量至少可解析。
```

- [ ] **Step 4: 启动 OpenReplay**

Run:

```bash
s local-prod-vm "cd /home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like && docker compose up -d"
```

Expected:

```text
OpenReplay 相关容器被创建并进入 `Up` 过程。
```

- [ ] **Step 5: 查看容器状态**

Run:

```bash
s local-prod-vm "cd /home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like && docker compose ps"
```

Expected:

```text
至少能看到 replay ingest 所需服务已进入 `Up`，并能识别是否还有待排障的容器。
```

## Task 3: 验证 VM 上 replay 入口已可达

**Files:**

- Runtime only: `/home/meteor/DEV/infra/stack/docker-setting/openreplay/prod-like`

- [ ] **Step 1: 验证 VM 上 `9001` 监听**

Run:

```bash
s local-prod-vm "ss -ltnp | rg ':9001\\b'"
```

Expected:

```text
可以看到 VM 上 `9001` 已监听，说明 OpenReplay 前门端口已被暴露。
```

- [ ] **Step 2: 验证 VM 上 replay ingest 本地可访问**

Run:

```bash
s local-prod-vm "curl -sS -D - -o /tmp/openreplay_ingest_check.out http://127.0.0.1:9001/ingest"
```

Expected:

```text
返回值不是连接失败；收到 `200`、`404`、`405` 或产品自定义状态码都可接受，关键是链路可达。
```

- [ ] **Step 3: 验证 VM 上 UI 前门本地可访问**

Run:

```bash
s local-prod-vm "curl -sS -D - -o /tmp/openreplay_ui_check.out http://127.0.0.1:9001/"
```

Expected:

```text
返回值不是连接失败；收到 `200`、`302` 或产品自定义状态码都可接受。
```

## Task 4: 调整本机 Nginx 的 replay 路径映射

**Files:**

- Modify if needed: `/home/meteor/DEV/infra/stack/docker-setting/nginx/conf.d/dev.conf`

- [ ] **Step 1: 让 replay 路由映射到上游 `/ingest` 并校验配置片段**

Run:

```bash
rg -n "/observability/frontend/replay|/observability/replay|/ingest|192\\.168\\.0\\.113:9001" \
  "/home/meteor/DEV/infra/stack/docker-setting/nginx/conf.d/dev.conf"
```

Expected:

```text
配置能体现 `/observability/frontend/replay` 和尾路径都被转发到上游 `/ingest`，并兼容旧路径 `/observability/replay`。
```

- [ ] **Step 2: 静态校验 Nginx 配置**

Run:

```bash
docker exec nginx-proxy nginx -t
```

Expected:

```text
配置检查返回 0。
```

- [ ] **Step 3: reload Nginx**

Run:

```bash
docker exec nginx-proxy nginx -s reload
```

Expected:

```text
Nginx reload 成功，新的 replay 路由映射开始生效。
```

## Task 5: 验证公网站点同源 replay 入口

**Files:**

- Runtime only: `/home/meteor/DEV/infra/stack/docker-setting/nginx`

- [ ] **Step 1: 复测本机公网站点 replay 入口**

Run:

```bash
curl -k -sS -D - -o /tmp/frontend_observability_replay_prod_like.out \
  --resolve 'dev.astro777.cfd:443:127.0.0.1' \
  'https://dev.astro777.cfd/observability/frontend/replay'
```

Expected:

```text
请求不再返回 `502`，说明同源 replay 入口已能到达 VM 上的 OpenReplay 前门。
```

- [ ] **Step 2: 复测尾斜杠变体**

Run:

```bash
curl -k -sS -D - -o /tmp/frontend_observability_replay_prod_like_slash.out \
  --resolve 'dev.astro777.cfd:443:127.0.0.1' \
  'https://dev.astro777.cfd/observability/frontend/replay/'
```

Expected:

```text
尾斜杠变体同样不再返回 `502`，说明 rewrite 与代理规则一致。
```

- [ ] **Step 3: 若仍失败，读取 Nginx 错误日志定位真实 upstream**

Run:

```bash
tail -n 20 "/home/meteor/DEV/infra/stack/docker-setting/nginx/logs/error.log"
```

Expected:

```text
能看到最新 replay 请求是否仍存在 `connection refused`；若 upstream 不是 `192.168.0.113:9001`，说明本机 Nginx 仍需继续调整。
```

## Task 6: 最终留痕

**Files:**

- Modify if needed: `/home/meteor/DEV/projects/test/contract-frontend/docs/how-to/operations/openreplay-setup.md`
- Completed location: `/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-15-openreplay-prod-like-deployment-design.md`
- Completed location: `/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-15-openreplay-prod-like-deployment-plan.md`

- [ ] **Step 1: 如部署方式与现有文档冲突，则更新 OpenReplay 操作文档**

Run:

```bash
rg -n "observability/frontend/replay|192\\.168\\.0\\.113:9001|内网|管理员|ingest" \
  "/home/meteor/DEV/projects/test/contract-frontend/docs/how-to/operations/openreplay-setup.md"
```

Expected:

```text
操作文档能明确说明 replay 现在经由公网站点同源入口进入、VM 承接 replay ingest，且 UI 当前仅保证内网/管理员访问。
```

- [ ] **Step 2: 设计与计划 completed 化**

Run:

```bash
ls \
  "/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-15-openreplay-prod-like-deployment-design.md" \
  "/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-15-openreplay-prod-like-deployment-plan.md"
```

Expected:

```text
当实现与验证都通过后，design 与 plan 已从 active 迁入 completed。
```

- [ ] **Step 3: 记录验证边界**

Run:

```bash
rg -n "Completion Summary|trace|replay|UI|内网|同源入口" \
  "/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-15-openreplay-prod-like-deployment-plan.md"
```

Expected:

```text
completed 留痕明确说明 trace 已接通、replay 已经由 VM 部署补齐并通过同源入口验证、UI 是否公网暴露不在本轮范围内。
```

## Self-Review

### Spec coverage

- VM 侧 OpenReplay 部署文件落地：Task 1
- VM 启动与本地可达性：Task 2、Task 3
- 公网站点 Nginx 映射与同源入口验证：Task 4、Task 5
- 文档与 completed 留痕：Task 6

### Placeholder scan

- 每个任务都已补齐 `Files / Step / Run / Expected`
- 已从旧的 `File Map` 收敛到统一 `File Structure`

### Type consistency

- replay 入口统一使用：
  - `/observability/frontend/replay`
  - `/ingest`
- VM 入口统一使用：
  - `192.168.0.113:9001`
- 文档职责统一使用：
  - design 负责方案
  - implementation plan 负责执行与验证
