Status: completed
Owner: frontend
Last verified: 2026-04-14
Source of truth: yes

# Frontend Observability Trace / Replay Unification Design

## 背景

上一轮 `frontend-observability` 已完成以下收敛：

- `logs/errors/security/sourcemap/symbolicate` 已进入 `frontend-observability` 服务域
- frontend 同源 observability 入口已建立：`/observability/frontend/`
- `trace` 仍走 `/observability/otel`
- `replay` 仍走 `/observability/replay`

当前问题不是能力缺失，而是服务域边界还不一致：

- 对外入口分散，frontend observability 没有真正形成一组统一命名空间
- 文档、部署和运维认知上仍把 `trace/replay` 视为“旁路能力”
- 新服务域与旧路径长期并存，后续治理和迁移成本会上升

## 本轮目标

- 将 frontend observability 对外入口统一收敛到 `frontend-observability` 命名空间
- 将 frontend trace 入口收敛为 `/observability/frontend/v1/traces`
- 将 frontend replay 入口收敛为 `/observability/frontend/replay/...`
- 保持 `trace/replay` 的下游处理仍由专用后端负责，不在 `frontend-observability` Node 服务中重写协议接收层
- 建立可回滚、低风险的迁移方案，并保留短期兼容窗口

## 非目标

- 不在本轮重写 OpenTelemetry OTLP traces 接收逻辑
- 不在本轮重写 OpenReplay ingest/backend 协议
- 不把 replay 伪装成单一 REST 资源接口
- 不对 frontend logger / error / security / sourcemap 既有 schema 再做一轮重构
- 不做与本轮无关的 Collector 或 OpenReplay 产品级回归测试

## 外部最佳实践结论

本轮采用的做法来自两类共识：

### 1. 浏览器观测入口可以统一，但下游应保持标准/原生协议

- OpenTelemetry 官方推荐生产环境通过 Collector 作为中心接收/处理点
- Browser OTLP exporter 在浏览器侧使用 HTTP 协议族，不建议在中间层发明新的自定义 traces 协议
- Session replay 产品通常允许通过同源 proxy / tunnel / custom endpoint 暴露统一入口，但下游仍由产品原生 backend 处理

### 2. 服务域应统一，协议处理不必统一

- `logs/errors/security` 已经存在内部 event schema，因此适合由 `frontend-observability` 真正接收并转 OTLP logs
- `trace` 适合保留为 OTLP traces -> Collector
- `replay` 适合保留为 OpenReplay 原生 ingest -> OpenReplay backend

## 采用方案

采用“统一外部路径，内部分流到专用后端”的方案。

### 对外路径

- `POST /observability/frontend/v1/traces`
- `/observability/frontend/replay/...`
- 继续保留：
  - `/observability/frontend/v1/events`
  - `/observability/frontend/v1/security/csp-reports`
  - `/observability/frontend/v1/sourcemaps`
  - `/observability/frontend/v1/symbolicate`

### 内部分流

- `/observability/frontend/v1/traces`
  - 由 Nginx 直接转发到 OTEL Collector 的 traces 接收端
- `/observability/frontend/replay/...`
  - 由 Nginx 以前缀代理方式转发到 OpenReplay ingest
- `/observability/frontend/v1/events` 等现有 API
  - 继续由 `frontend-observability` Node 服务实现

## 为什么不把 trace / replay 接收写进 Node 服务

### trace

- `trace` 的下游已经是标准 OTLP traces pipeline
- 在 Node 服务里再包一层自定义接收逻辑，只会增加协议耦合与额外 hop
- 当前 Nginx 已经承担同源路径治理职责，直接转发到 Collector 更简单、更符合标准职责边界

### replay

- OpenReplay ingest 不是我们定义的业务资源 API，而是一组产品原生入口
- 把 replay 接收写进 Node 服务，会让我们承担 OpenReplay 协议兼容、升级和排障负担
- replay 更适合以前缀代理的方式并入服务域，而不是重写为 `v1` REST 接口

## 路径与配置设计

### frontend 配置

- `otelEndpoint`
  - 从 `/observability/otel` 迁到 `/observability/frontend/v1/traces`
- `openReplay.ingestPoint`
  - 从 `/observability/replay` 迁到 `/observability/frontend/replay`
- `frontendObservabilityEndpoint`
  - 保持 `/observability/frontend`

### Nginx 配置

- 继续保留 `frontend_observability` upstream
- 新增或调整以下路由：
  - `/observability/frontend/v1/traces` -> `otel_collector`
  - `/observability/frontend/replay/` -> `openreplay_ingest`
- 保留旧路由一段迁移窗口：
  - `/observability/otel/`
  - `/observability/replay/`

## 迁移策略

### Phase 1：双入口并存

- Nginx 同时暴露旧路径和新路径
- frontend 代码切换到新路径
- 观测运行态只从新路径验证，不做双发

### Phase 2：验证运行态

- 确认 traces 能通过新路径进入 Collector
- 确认 replay 能通过新前缀建立 session
- 确认现有 `events/security/sourcemap` 不受路由新增影响

### Phase 3：移除旧路径

- 运行一段稳定窗口后移除：
  - `/observability/otel`
  - `/observability/replay`
- 同步更新运维文档与部署说明

## 回滚策略

- 前端配置可直接回切旧路径
- Nginx 可快速把新路径下线并恢复旧入口
- 本轮不引入新的内部 schema，因此不需要 schema 级回滚
- `frontend-observability` Node 服务主体不承接 traces/replay 协议处理，因此回滚主要集中在入口配置与代理规则

## 测试与验收标准

只验证本轮仍存在真实不确定性的边界，不把设计阶段已排除的问题重新写成兜底测试。

### 单元测试

- frontend 默认 endpoint 是否切到新路径
- replay ingestPoint 默认值是否切到新前缀
- traces exporter endpoint 是否切到新路径

### 集成测试

- 新 trace 入口是否到达 Collector
- 新 replay 前缀是否能建立有效 session
- `/observability/frontend/` 现有 `events/security/sourcemap` 能力不回归

### 运行态验收

- 在 Collector / SigNoz 中能观察到通过新入口产生的 frontend traces
- 在 OpenReplay 后台能观察到通过新前缀建立的 session
- frontend 应用初始化不因 observability 配置切换而失败
- 旧路径保留期间，新旧入口都可访问，但 frontend 实际只使用新路径

### 明确不测

- 不为“我们不重写 trace/replay 协议”单独增加兜底验证
- 不为 replay 增加我们自己并不存在的 schema 解析测试
- 不做与本轮无关的 Collector/OpenReplay 产品内部回归测试
- 不把一般性的业务页面回归混入 observability 专项验收

## 风险与控制

### 风险 1：replay 路径设计成伪 REST 端点

控制：

- 采用代理前缀 `/observability/frontend/replay/...`
- 不设计成单一 `POST /v1/replay`

### 风险 2：统一入口后职责边界再次模糊

控制：

- 文档明确区分“服务域统一”与“协议处理统一”不是一回事
- Nginx 路由、Node 服务职责和下游平台职责分别记录

### 风险 3：迁移时误删旧入口

控制：

- 先双入口并存
- 先切 frontend，再移除旧路由
- 验证通过后再删旧路径

## 预期结果

完成后，frontend observability 的对外认知会统一为一组命名空间：

- `frontend-observability` 服务域拥有全部 frontend observability 入口
- `logs/errors/security/sourcemap` 由 Node 服务真正接收
- `trace` 通过统一新路径进入 Collector
- `replay` 通过统一新前缀进入 OpenReplay

这样既完成服务域收敛，也不引入不必要的协议重写与长期维护负担。

## 实现结果（2026-04-14）

- 新 trace 入口已落地：`/observability/frontend/v1/traces`
- 新 replay 前缀已落地：`/observability/frontend/replay`
- 兼容窗口已保留：`/observability/otel` 与 `/observability/replay`
- 验证边界：
  - 已完成前端定向单测与静态配置校验
  - 尚未执行 Nginx reload / live smoke 验证

## 参考

- OpenTelemetry JS exporters: https://opentelemetry.io/docs/languages/js/exporters/
- OpenTelemetry components: https://opentelemetry.io/docs/concepts/components/
- OTLP exporter protocol spec: https://opentelemetry.io/docs/specs/otel/protocol/exporter/
- OpenReplay docs: https://docs.openreplay.com/
- Datadog Browser SDK proxy guidance: https://docs.datadoghq.com/real_user_monitoring/guide/proxy-rum-data/
- Grafana Faro proxy guidance: https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/instrument/proxy-data/
- Sentry tunneling guidance: https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/tunneling/
