Status: completed
Owner: frontend
Last verified: 2026-04-14
Source of truth: yes

# Frontend Observability Service Design

**日期**: 2026-04-14
**适用范围**: 新建独立仓库或工作区 `frontend-observability`，并调整 frontend / infra 对接方式
**目标读者**: 已熟悉当前 frontend observability、OpenTelemetry、SigNoz、Nginx same-origin proxy 的维护者

## 背景

当前前端观测链路已经存在，但职责边界并不干净：

1. frontend runtime 已经具备多条观测能力
   - OpenTelemetry traces
   - OpenReplay session replay
   - JS / Vue error collectors
   - `securitypolicyviolation` collector
2. `sourcemap-resolver` 原本承担 source map 上传与堆栈解析
3. 为了接住 CSP report，`sourcemap-resolver` 又被扩展成了前端事件接收入口的一部分

这导致两个问题：

- **服务职责混杂**
  - source map symbolication
  - CSP/security ingest
  - OTLP forwarding
  被塞进同一个服务
- **前端日志工程化尚未建立**
  - 当前 traces、replay、errors、CSP 都是分散接入
  - 没有统一的 frontend event schema
  - 没有统一的 logger facade
  - 没有明确的 ingest boundary、sampling、PII redaction、retention 分层

本轮设计目标不是一次性重写全部 frontend observability，而是先建立一个清晰、可演进的服务域。

## 目标

- 建立独立仓库或工作区 `frontend-observability`
- 将 frontend runtime observability 的统一入口从 `sourcemap-resolver` 中剥离
- 让 frontend logs、errors、security events、custom frontend events 进入统一 ingest 边界
- 保留 source map 上传与 symbolication 能力，但将其收敛为同一服务域下的独立模块
- 以下游 `OpenTelemetry Collector / SigNoz` 为标准出口，统一转为 OTLP
- 保持 frontend 侧对外 API 稳定，不把 OTLP 协议细节暴露给业务代码

## 非目标

- 不在本轮一次性重写全部 frontend observability SDK
- 不把 traces、replay、logs、metrics 强行在 frontend 侧统一成一个大而全的 SDK
- 不在本轮把服务直接拆成多进程或多仓库协作体系
- 不做全仓 `console.*` 扫荡式替换
- 不在本轮设计后端通用日志平台；本次只处理 frontend observability 服务域

## 方案比较

### 方案 A：继续把服务代码放在 infra 目录旁边

优点：

- 迁移最快
- 目录变动最少

缺点：

- 服务代码与部署配置继续混杂
- CI、测试、版本和发布边界不清晰
- sourcemap / ingest / schema 的持续演进会继续污染 infra

结论：不采用。

### 方案 B：新建独立仓库或工作区，infra 只保留部署配置

优点：

- 服务代码职责边界最清楚
- 可独立测试、构建、发布
- infra 只保留 compose、nginx、env 和 image 引用
- 适合后续继续演进 frontend logs、security events、symbolication

缺点：

- 需要新增仓库或工作区管理成本

结论：采用。

### 方案 C：把服务端代码放进 frontend 仓库的 `services/` 目录

优点：

- 和 frontend schema、logger facade 协作距离更近

缺点：

- frontend app repo 与 service repo 职责混在一起
- 长期仍不如方案 B 清晰

结论：本轮不采用。

## 采用方案

采用 **方案 B**：

- 新建独立仓库或工作区 `frontend-observability`
- infra 仓库仅保留部署配置
- 新服务内部采用 **单进程单入口、模块内分层**

## 总体架构

`frontend-observability` 是一个专门面向 frontend runtime observability 的服务域，而不是通用后端日志平台。

它内部收敛为三个核心模块：

1. `ingest`
   - 接收 frontend runtime events
   - 接收 frontend logger logs
   - 接收 frontend error events
   - 接收 frontend security events
2. `symbolication`
   - source map 上传
   - release / build artifact 映射
   - stack trace symbolication
3. `forwarders`
   - 将内部统一事件模型转为 OTLP logs
   - 向 OpenTelemetry Collector / SigNoz 下游转发

### 模块边界

#### `ingest`

职责：

- 对外暴露统一 frontend event ingest API
- 做 schema 校验
- 做字段规范化
- 做 PII redaction
- 做 sampling / rate limit / batching

不负责：

- source map 上传与解析
- runtime stack trace symbolication 细节
- 下游 OTLP 的对外协议暴露

#### `symbolication`

职责：

- 接收 source map artifact
- 维护 release/build 到 source map 的映射
- 提供 stack symbolication 能力

不负责：

- 接收所有 frontend runtime events
- 承担统一 frontend event ingest 的 public API

#### `forwarders`

职责：

- 将 internal event model 映射为 OTLP logs
- 屏蔽 frontend schema 与 OTLP schema 差异
- 对接现有 collector / SigNoz

不负责：

- 业务事件定义
- source map 存储策略

## API 设计

对外 API 分为两层：

### 1. 统一 frontend event 入口

#### `POST /v1/events`

用途：

- frontend 自家 logger facade
- frontend error collectors
- frontend 增强后的 `securitypolicyviolation`
- 未来的 custom frontend events

支持：

- 单条事件
- 批量事件

此入口只接收内部定义的统一 event envelope，不直接暴露 OTLP 格式。

### 2. 协议特例与诊断入口

#### `POST /v1/security/csp-reports`

用途：

- 接收 browser-native CSP report
- 兼容 `application/csp-report`
- 兼容 Reporting API `report-to` 负载
- 接收后统一转换为 internal security event

#### `PUT /v1/sourcemaps`

用途：

- 上传 source map artifact

#### `POST /v1/symbolicate`

用途：

- 按需执行 stack trace symbolication

#### `GET /health`

用途：

- 健康检查

## 统一事件模型

所有进入 `/v1/events` 的数据都必须先归一为统一 envelope。

核心字段：

- `eventId`
- `timestamp`
- `category`
- `level`
- `message`
- `service.name`
- `service.version`
- `service.environment`
- `service.release`
- `context.url`
- `context.route`
- `session.sessionId`
- `trace.traceId`
- `trace.spanId`
- `payload`
- `tags`

### 字段语义

- `service.*`
  - 指 **frontend app 本身**
  - 不是 `frontend-observability` 服务的版本
- `observer.*` 或 `collector.*`
  - 指 `frontend-observability` 自身版本
  - 作为服务端接收与转发元数据使用

### category 分类

#### `log`

来源：

- `logger.debug/info/warn/error`

用途：

- 记录 frontend 运行中的关键状态变化与诊断信息

#### `error`

来源：

- JS runtime error
- Promise rejection
- Vue error

用途：

- 记录不可忽略的 frontend 异常

#### `security`

来源：

- frontend 增强后的 `securitypolicyviolation`
- browser-native CSP report 转换结果

用途：

- 记录 browser security policy 相关事件

#### `custom`

来源：

- 未来业务自定义 frontend events

用途：

- 记录显式定义的业务留痕事件

## Frontend Logger 设计

frontend 业务代码不直接面向 OTLP，也不直接依赖 `console.*`。

统一提供 logger facade：

- `logger.debug()`
- `logger.info()`
- `logger.warn()`
- `logger.error()`

logger facade 默认补齐公共上下文字段：

- `service.name`
- `service.version`
- `service.environment`
- `service.release`
- `route`
- `url`
- `sessionId`
- `traceId`
- `spanId`
- `userId` 或匿名用户标识
- `module` / `component`

### 日志级别策略

#### `debug`

- development 默认开启
- production 默认关闭或极低采样

#### `info`

- 只记录关键状态变化
- 不记录流水账

#### `warn`

- 记录可恢复异常、降级、重试

#### `error`

- 记录不可忽略的问题
- 默认全量保留

## 归档与保留策略

frontend logs 不采用“全量原样收集”的策略，而采用价值分层。

### 全量或高优先级保留

- `error`
- `security`

### 中优先级保留

- `warn`

### 白名单或采样保留

- `info`

### 默认不在生产全量保留

- `debug`

### retention 建议

- `error` / `security`: 最长
- `warn`: 中等
- `info`: 较短
- `debug`: 极短或关闭

## PII 与安全治理

frontend logs 比后端日志更容易误打敏感信息，因此 ingest 层必须承担服务端治理责任。

最低要求：

- URL / query 参数脱敏
- token / cookie / password / phone / id card 等敏感字段清洗
- 长文本截断
- 大对象裁剪或拒收
- 字段白名单优先于字段黑名单

本轮不依赖 frontend 自觉保证日志安全。

## 与 OTEL / SigNoz 的关系

frontend app 不直接面向 OTLP `/v1/logs`。

原因：

- frontend 侧不应被 OTLP 协议细节绑定
- ingest 侧需要保留 schema 演进、兼容、脱敏、采样、下游变更空间

因此采用：

- frontend -> internal event envelope
- `frontend-observability` -> OTLP logs
- collector / SigNoz -> 存储、检索、告警

## 浏览器原生 CSP report 与 frontend 增强事件的边界

两者都保留，但职责不同。

### browser-native CSP report

价值：

- 不依赖 frontend JS 初始化成功
- 更接近 browser 的真实裁决
- 适合作为 rollout 与安全治理的基线信号

### frontend 增强 `securitypolicyviolation`

价值：

- 能补 route、sessionId、traceId、sessionUrl 等排障上下文
- 更适合问题定位

结论：

- browser-native report 继续保留
- frontend 增强事件继续保留
- 二者在服务端统一归档为 `security` 类别事件

## 实施阶段划分

### Phase 1：建立新服务最小骨架

交付：

- 独立仓库或工作区 `frontend-observability`
- `GET /health`
- `POST /v1/events`
- `POST /v1/security/csp-reports`
- `PUT /v1/sourcemaps`
- `POST /v1/symbolicate`
- schema 校验与 OTLP forwarder 最小实现

### Phase 2：迁移 CSP / security ingest

交付：

- 将 browser-native CSP report 接收逻辑迁入新服务
- 将 frontend 增强 `securitypolicyviolation` ingest 迁入新服务
- `sourcemap-resolver` 不再承担 CSP ingest

### Phase 3：引入统一 frontend logger

交付：

- frontend 新增 logger facade
- `logger.info/warn/error` 进入 `/v1/events`
- 只覆盖新路径与 observability collectors，不做全仓日志清洗

### Phase 4：迁移 frontend errors

交付：

- JS error
- Vue error
- Promise rejection
  统一进入 `/v1/events`

### Phase 5：迁移 sourcemap symbolication

交付：

- source map 上传与 stack symbolication 能力迁入新服务域
- `sourcemap-resolver` 退回纯旧能力，最终可下线或并入新服务

## 兼容策略

迁移过程中尽量保持 same-origin 外部路径稳定，优先调整 upstream target，而不是先修改 frontend app 的所有调用点。

迁移窗口内允许：

- frontend app 保持 `/observability/...` 入口不变
- nginx 将不同路径代理到旧服务或新服务
- 在服务端逐步完成职责切换

## 测试策略

### 新服务单元测试

- schema 校验
- CSP report 规范化
- OTLP payload 构造
- source map symbolication

### frontend 集成测试

- logger facade -> `/v1/events`
- `securitypolicyviolation` collector -> `/v1/security/csp-reports` 或 `/v1/events`
- error collectors -> `error` 类别事件

### 环境验证

- nginx same-origin 路径通达
- OTLP downstream 可见事件
- source map 上传和 symbolication 不回归

## 风险与控制

### 风险 1：服务职责再次膨胀

控制：

- 统一服务域，不统一职责
- `ingest` / `symbolication` / `forwarders` 明确分模块

### 风险 2：frontend 日志噪音过高

控制：

- `info` 白名单
- `debug` 非生产默认关闭
- rate limit 与 sampling 在 ingest 层实现

## 实施结果（2026-04-14）

已完成以下落地：

- 独立服务目录 `/home/meteor/DEV/projects/test/frontend-observability` 已建立
- `/v1/events`、`/v1/security/csp-reports`、`/v1/sourcemaps`、`/v1/symbolicate`、`/health` 已实现并有测试覆盖
- frontend 已接入统一 logger facade，errors/security 已进入新服务域
- `sourcemap-resolver` 已移除 frontend event ingest，只保留迁移期兼容职责
- compose 与 Nginx 配置已补齐 `frontend-observability` 的部署与同源路由

验证边界：

- 本地单服务健康检查已通过
- same-origin `curl` 已命中本机 Nginx，但返回 `502`，说明运行中的 Nginx 尚未 reload 到本次变更后的配置，且新容器未在该路径后面实际启动
- traces / replay 统一化仍属于后续议题，不在本轮实现范围

### 风险 3：PII 泄漏

控制：

- 服务端清洗优先
- schema 白名单
- 大字段限制

### 风险 4：一次性迁移范围失控

控制：

- 按 Phase 分段
- 优先迁移 CSP / security ingest
- 不做全仓 `console.*` 清洗

## 外部参考结论

本设计与以下外部实践保持一致：

- OpenTelemetry 作为 logs/traces/metrics 的标准底座
- browser-native CSP report 与内部事件模型分层处理
- source map 作为 frontend observability 服务域下的 artifact / symbolication 模块
- 统一 frontend ingest 边界，而不是把 observability 能力散落在多个临时服务里

## 结论

本轮采用的最终设计是：

- 独立仓库或工作区 `frontend-observability`
- TypeScript + Node.js
- 单进程单入口、模块内分层
- 统一 frontend event ingest
- 保留独立 symbolication 模块
- 以 OTLP / SigNoz 为下游标准出口
- 分阶段迁移，先迁 security ingest，再迁 logger / errors / sourcemap
