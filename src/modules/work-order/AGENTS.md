# Work-Order Agent Notes

## Entry Points

- `application/work-order-service.ts`
- `application/hooks/`
- `application/hooks/useWorkOrderUpload`
- `presentation/`

## Local Commands

- `pnpm test:unit --run`

## Boundaries

- 用户侧和处理人侧共用 domain，但 repository / endpoint 分开。
- `workOrderService` 是唯一对外服务门面，hooks 不直接碰 repository。
- 上传链路与工单 CRUD 解耦，保持独立。

## High-Risk Changes

- query key 失效策略
- 用户侧 / 处理人侧接口边界
- 上传与核心流程耦合

## Related Source-Of-Truth Docs

- `README.md`
- `../../../docs/index.md`
