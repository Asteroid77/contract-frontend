# agent-aggregate 模块 AGENTS 指令

## 全局规则引用

本模块内改动以模块边界与分层规则优先，但以下全局规则必须遵循：

- 统一遵循 `Rule.md`。
- 用户可见文案必须走 i18n（`useI18n` / `$t`），禁止硬编码。
- 样式优先使用主题 token / CSS 变量，避免业务代码硬编码主色值。
- 请求相关遵循 TanStack Query 与全局请求处理约定，不重复实现全局 toast。

## 模块定位

`src/modules/agent-aggregate` 是代理人聚合看板模块，负责聚合并展示以下面板：

- 概览（overview）
- 漏斗（funnel）
- 趋势（trend）
- 业绩（performance）
- 结构（structure）
- 续约（renewal）

该模块面向看板场景，核心关注点是：查询编排、图表展示、异常/空态兜底与响应式布局。

## 目录与职责

```text
agent-aggregate/
├── domain/                            # 纯领域类型（VO/DTO/查询参数）
├── application/
│   ├── agent-aggregate-service.ts     # 应用服务：编排仓储调用
│   └── hooks/useAgentAggregateService.ts
│                                      # vue-query hooks 与 query keys
├── infrastructure/
│   ├── agent-aggregate-endpoints.ts   # 端点定义
│   └── agent-aggregate-repository.ts  # HTTP 请求实现
└── presentation/dashboard/
    ├── AgentAggregateDashboardPage.vue
    ├── components/                    # 面板组件与统一状态框架
    ├── charts/                        # ECharts 包装与类型
    ├── utils/                         # 格式化、状态构建等 UI 辅助逻辑
    └── styles/AgentAggregateDashboard.css
                                       # 仪表盘样式（含容器查询等）
```

## 依赖约束

### 允许

- 允许依赖 `src/modules/shared` 的通用能力（请求封装、API 前缀、通用工具等）。
- application hooks 可依赖 `@tanstack/vue-query` 与查询上下文封装。
- presentation 层可依赖 Vue、Naive UI、ECharts、vue-i18n。

### 禁止

- 禁止直接依赖其他业务模块实现（跨业务模块调用请走 shared 或明确抽象）。
- domain 层禁止依赖 infrastructure/presentation 与框架运行时。
- presentation 层禁止绕过 hooks 直接调用 repository/service 发请求。
- 禁止将本模块样式散落到模块外；样式应保留在本模块 `presentation/dashboard/styles` 内。

## 修改本模块的规则

1. 新增后端接口必须按链路增加：`endpoints -> repository -> service -> hooks -> presentation`。
2. query key 必须在 `useAgentAggregateService.ts` 统一维护，避免面板内临时拼 key。
3. 面板统一使用 `DashboardPanelFrame` 承载 loading/error/empty/success 状态，不重复造状态壳。
4. 错误态文案与字段展示必须 i18n 化；`TraceId / RequestId / Retry` 相关显示保持居中对齐。
5. 漏斗（funnel）description 与趋势（trend）保持一致，显示在标题右侧。
6. 业绩（performance）头部保持 `title / tabs / description` 三段式（左/中/右），布局继续用 grid 实现。
7. 需要抽象的通用逻辑优先在本模块 `presentation/dashboard/utils` 内复用；跨模块复用再上提到 `shared`。
8. 响应式必须覆盖移动端宽度，优先使用 Container Queries；`subgrid`/`anchor positioning` 使用时需保留回退方案。

## 变更边界与验证

- 单次改动优先限定在 `src/modules/agent-aggregate`，必要时才改 shared，并在变更说明中说明原因。
- 完成后至少执行 `pnpm -s type-check`；涉及样式/交互变更时补充看板页面回归验证。
