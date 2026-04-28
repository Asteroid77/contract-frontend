# Agent-Aggregate Agent Notes

## Entry Points

- `application/agent-aggregate-service.ts`
- `application/hooks/useAgentAggregateService.ts`
- `presentation/dashboard/AgentAggregateDashboardPage.vue`

## Local Commands

- `pnpm type-check`

## Boundaries

- 新接口保持 `endpoints -> repository -> service -> hooks -> presentation` 链路。
- query key 只在 `useAgentAggregateService.ts` 统一维护。
- 面板状态统一走 `DashboardPanelFrame`，样式只留在模块内 dashboard 样式目录。

## High-Risk Changes

- 仪表盘响应式布局
- query key 与缓存失效
- 图表口径和错误态展示

## Related Source-Of-Truth Docs

- `../../../docs/index.md`
