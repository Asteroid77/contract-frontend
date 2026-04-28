Status: active
Owner: frontend
Last verified: 2026-04-15
Source of truth: yes

# ClickHouse 内部日志与机器规格指引

## Purpose

归档 `system.trace_log`、`system.metric_log`、`system.query_log` 的使用边界、机器规格判断线与当前默认策略，避免后续把 ClickHouse 内部诊断日志与业务观测数据混淆。

## Scope

适用于当前仓库依赖的 `SigNoz + ClickHouse + frontend-observability + OpenReplay` 观测链路，重点覆盖：

- ClickHouse 内部系统日志表
- 单机 / VM 场景下的磁盘预算判断
- 小规模业务项目的默认开关策略

不覆盖：

- 多节点 ClickHouse 集群
- 对象存储冷热分层细节
- ClickHouse 故障排查时的临时 profiler 操作手册

## 核心结论

### 1. 不要把内部日志表当成业务观测数据

- `system.trace_log`
  - ClickHouse 自己的 profiler / stack trace 采样日志
  - 记录 `CPU`、`Real`、`Memory`、`MemoryPeak` 等内部采样
  - 不是业务 trace
- `system.metric_log`
  - ClickHouse 自己把 `system.metrics` / `system.events` 周期性落盘的历史表
  - 不是业务 metrics
- `system.query_log`
  - ClickHouse 自己的查询历史
  - 对慢查询、异常 SQL 和排障较有价值
  - 成本远低于 `trace_log`

业务主数据仍然落在：

- traces -> `signoz_traces`
- metrics -> `signoz_metrics`
- logs -> `signoz_logs`

关闭 `system.trace_log` / `system.metric_log` 不会阻断业务 traces / metrics / logs 的写入。

### 2. 默认长期保留的优先级

- 首选保留：`query_log`
- 视预算短期保留：`metric_log`
- 默认不长期保留：`trace_log`

`trace_log` 更适合 ClickHouse 自身故障排查窗口内的临时启用，而不是小盘单机的长期默认配置。

### 3. 决定是否能开的关键不是用户量，而是磁盘预算

判断线优先看：

1. 可用磁盘，不是总磁盘
2. 磁盘类型，优先 NVMe / SSD
3. retention 目标
4. 是否有冷热分层 / 对象存储

对 observability 节点来说，CPU / 内存决定“查得动”，磁盘决定“留得住”。

## 机器规格建议

### 档位 A：`4C8G + 100G~150G SSD`

- `query_log`
  - 可开
  - TTL 建议 `1-3 DAY`
- `metric_log`
  - 默认关
- `trace_log`
  - 关

适用：

- 开发机
- 轻量 demo
- 低频单人环境

### 档位 B：`8C16G + 240G SSD/NVMe`

- `query_log`
  - 可开
  - TTL 建议 `7-14 DAY`
- `metric_log`
  - 默认关
  - 如需保留内部指标历史，TTL 不超过 `1 DAY`
- `trace_log`
  - 默认关
  - 仅在 ClickHouse 自身故障排查窗口内临时开启

适用：

- 小规模生产
- 单机 prod-like
- 当前仓库所处的主机规格

### 档位 C：`16C32G + 500G~1TB NVMe`

- `query_log`
  - 可开
  - TTL 建议 `14-30 DAY`
- `metric_log`
  - 可开
  - TTL 建议 `1-3 DAY`
- `trace_log`
  - 仍不建议常开
  - 仅建议短时诊断或配极短 TTL

适用：

- 较舒适的单机观测节点
- 中低到中等负载的长期环境

### 档位 D：`32C64G + 1TB+ NVMe`

- `query_log`
  - 可开
  - TTL 可到 `30 DAY+`
- `metric_log`
  - 可开
  - TTL 建议 `3-7 DAY`
- `trace_log`
  - 仍建议默认关闭
  - 只有明确诊断 ClickHouse 内部问题时才考虑更长窗口

适用：

- 更高预算的专用观测节点
- 已有较强磁盘冗余或后续可做冷热分层的环境

## 当前默认策略

当前推荐默认策略：

- `query_log`
  - 开启
  - TTL `7 DAY`
- `metric_log`
  - 默认关闭
  - 如果确实要看 ClickHouse 自身指标历史，TTL 上限 `1 DAY`
- `trace_log`
  - 默认关闭
- `asynchronous_metric_log`
  - 默认关闭
- `processors_profile_log`
  - 默认关闭
- query profiler / memory profiler
  - 默认关闭

这套默认值适用于：

- `8C16G + 240G`
- 无对象存储冷热分层
- 以业务 traces / metrics / logs 为主，而不是长期分析 ClickHouse 自身内部行为

## 什么时候可以临时开 `trace_log`

仅在以下场景考虑临时启用：

- 怀疑 ClickHouse 自己存在内存异常
- 怀疑 ClickHouse 自己存在 CPU hotspot
- 需要分析 allocator / stack trace / profiler 行为

启用要求：

- 先确认磁盘余量充足
- 明确故障窗口
- 排查完成立即关闭
- 不把它作为常驻配置

## 红线

- 本地块盘小于 `500G`：不要长期开 `trace_log`
- 本地块盘小于 `250G`：`metric_log` 也不应长期保留
- 单机观测节点：优先保留 `query_log`，放弃 `trace_log`
- 没有对象存储 / 冷热分层：所有内部日志都应短 TTL 或直接关闭

## 当前案例

2026-04-15 在 `local-prod-vm` 上的实际排查结论：

- 根盘：`57G`
- ClickHouse volume：`42.09GB`
- 其中 `system.trace_log`：`38.54GiB`
- 行数：约 `2.52 billion`
- 主类型：`MemoryPeak` / `Memory`

结论：

- 膨胀主因不是业务数据
- 而是 ClickHouse 自己的内部内存采样日志
- 清空 `system.trace_log` 后，根盘从 `100%` 恢复到 `24%`

这次案例可作为默认策略的直接反例：在小盘单机上长期开启 `trace_log` 成本极高，不符合当前项目形态。

## Related Docs

- `docs/how-to/operations/frontend-observability.md`
- `docs/plans/completed/2026-04-15-openreplay-prod-like-deployment-design.md`
- `docs/plans/completed/2026-04-15-openreplay-prod-like-deployment-plan.md`
