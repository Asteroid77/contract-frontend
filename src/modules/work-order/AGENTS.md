# work-order 模块 Agent 指令

## 全局规则引用

本模块内改动仍以本模块边界与分层规则为先；但 UI（discrete / theme）、文案（i18n）与搜索（advanced_query，`ModernQueryBuilder`）规则统一遵循 `Rule.md`。

## 定位

`src/modules/work-order` 是工单业务模块。它覆盖工单的完整生命周期：用户提交、处理人认领与处理、评分、工单分类管理。模块内部区分"用户侧"和"处理人侧"两套操作路径，通过统一的 `workOrderService` 门面对外暴露。

## 目录与职责

```
work-order/
├── domain/           # 领域类型与枚举（WorkOrderStatus、WorkOrderUserType、VO/DTO）
├── application/      # 应用服务、Vue Query hooks、表单校验规则
│   ├── work-order-service.ts   # 服务门面，聚合三个 repository
│   ├── hooks/                  # useWorkOrderService、useCategoryService、useWorkOrderUpload
│   └── rules/                  # categoryRules 表单校验
├── infrastructure/   # API 端点定义、仓储实现（work-order / handler / category）
├── presentation/     # 页面与 UI 组件（列表、详情、创建弹窗、状态徽章、评分区）
```

## 依赖约束

### 允许

- 本模块可 `import` `@/modules/shared` 下的任何导出（useRequest、IPage、共享组件等）。
- infrastructure 层可依赖 `@/modules/shared/infrastructure`（useRequest、api-prefix-generator）。
- application/hooks 可依赖 `@tanstack/vue-query`、`@/app/infrastructure/query`。
- presentation 可依赖 Naive UI、Vue Router、第三方 Markdown 编辑器。

### 禁止

- 本模块禁止 `import` 其他业务模块（`@/modules/contract`、`@/modules/access` 等）。
- domain 层禁止依赖 infrastructure、presentation、任何框架实现（Vue、axios、Naive UI）。
- 其他业务模块禁止直接 `import` 本模块内部实现；如需跨模块通信，走 shared 或事件机制。

## 修改本模块的规则

1. 工单状态流转逻辑（PENDING -> PROCESSING -> COMPLETED/CANCELLED）集中在后端，前端仅做展示和操作触发，不要在前端添加状态机校验。
2. 用户侧和处理人侧共用同一套 domain 类型，但 repository 和 endpoints 分开（`work-order-repository` vs `handler-repository`），新增 API 时注意放对文件。
3. `workOrderService` 是唯一对外服务入口，hooks 层通过它访问数据，不要在 hooks 中直接调用 repository。
4. 修改 endpoints 或 repository 时需同步检查对应的 Vue Query hooks 缓存失效策略（queryKey invalidation）。
5. 文件上传（useWorkOrderUpload）走独立的 OSS 流程，与工单 CRUD 解耦，改动时注意不要影响工单核心流程。
