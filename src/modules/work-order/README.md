# Work-Order Module

`work-order` 覆盖工单的用户侧提交、处理人侧认领/处理、评分以及分类管理。模块内部同时有业务流和上传流，修改前先确认自己碰的是哪一条链路。

## Key Entry Points

- `application/work-order-service.ts`
- `application/hooks/`
- `application/hooks/useWorkOrderUpload`
- `presentation/`

## Boundaries

- 用户侧与处理人侧共用 domain，但 repository 和 endpoint 分开。
- `workOrderService` 是唯一对外服务门面。
- 上传链路与 CRUD 解耦，避免把上传细节混入主流程。

## Related Docs

- `../../../docs/index.md`
