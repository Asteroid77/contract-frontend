# Approval Agent Notes

## Entry Points

- `application/service.ts`
- `application/hooks/`
- `application/print/`
- `presentation/approval/`

## Local Commands

- `pnpm test:unit --run`

## Boundaries

- 新接口保持 `repository -> service -> hooks -> presentation` 分层。
- 审批状态判断集中在 `application/utils.ts`，不要下沉到页面层复制。
- 打印数据处理留在 `application/print/`，UI 留在 `presentation/print/`。

## High-Risk Changes

- 状态流转判断
- hooks 与 repository 契约变化
- 打印模板和差异比较链路

## Related Source-Of-Truth Docs

- `README.md`
- `../../../docs/index.md`
