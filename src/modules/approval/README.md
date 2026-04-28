# Approval Module

`approval` 管理审批实例的创建、领取、处理、撤销、历史查询，以及打印与差异展示。改动审批状态、任务可操作性、打印模板时先从本模块阅读。

## Key Entry Points

- `application/service.ts`: 审批服务门面
- `application/hooks/`: 查询与 mutation 入口
- `application/print/`: 打印数据整理
- `presentation/approval/`: 审批页面

## Boundaries

- 新接口遵循 `repository -> service -> hooks -> presentation`。
- 状态判断集中在 `application/utils.ts`，不要在页面层复制。
- 打印数据处理与打印 UI 保持分层。

## Related Docs

- `../../../docs/index.md`
