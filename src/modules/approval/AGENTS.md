# approval 模块 Agent 指令

## 全局规则引用

本模块内改动仍以本模块边界与分层规则为先；但 UI（discrete / theme）、文案（i18n）与搜索（advanced_query，`ModernQueryBuilder`）规则统一遵循 `Rule.md`。

## 定位

`src/modules/approval` 是审批流程模块。它管理审批实例的生命周期：创建、领取、处理（通过/驳回）、撤销，以及审批历史查询。审批对象为泛型数据（`approvalData: T`），当前业务场景包括"用户信息审批"和"备案/签约信息审批"。

## 目录与职责

```
approval/
├── domain/           # 领域类型：ApprovalInstance、ApprovalHistory、枚举、DTO
├── application/      # 应用层：service 编排、业务工具函数、校验规则、vue-query hooks、打印渲染
│   ├── hooks/        # useApprovalService（vue-query 封装）、usePrint
│   └── print/        # 打印字段渲染、列表差异比较
├── infrastructure/   # 仓储实现：approval-repository（HTTP 请求）
├── presentation/     # UI 层
│   ├── approval/     # 审批实例页面、模板渲染、状态标签、差异对比、高级查询
│   └── print/        # 打印预览、文件差异展示、样式
```

## 依赖约束

### 允许

- `import` shared 模块的任何导出（类型、工具、组件、请求封装）。
- `import` user 模块的 `SignInResponse` 类型（用于权限判断，仅在 application/utils.ts 中）。
- infrastructure 层依赖 shared/infrastructure（`useRequest`、`createPrefixedEndpoints`）。
- presentation 层依赖 Naive UI、Vue、@tanstack/vue-query。
- application/hooks 依赖 `@/app/infrastructure/query/query-request-context`。

### 禁止

- domain 层禁止依赖 infrastructure、presentation、Vue、axios 或任何框架实现。
- 禁止 `import` contract、access 或其他业务模块（user 类型引用除外）。
- 禁止在 domain 层放置 UI 组件或请求逻辑。
- 禁止跨模块直接传递审批状态，其他模块应通过 approval 的 hooks 获取数据。

## 修改本模块的规则

1. domain 层只放纯类型和枚举，不引入运行时依赖。
2. 新增 API 端点时，先在 infrastructure/approval-repository.ts 添加端点定义和仓储方法，再在 application/service.ts 暴露服务方法，最后在 hooks 中封装 vue-query 调用。
3. 审批状态判断逻辑（`canClaimTask`、`canApproveTask` 等）集中在 application/utils.ts，不要在 presentation 层重复实现。
4. 修改 `approvalService` 或 `approvalRepository` 接口时需检查所有 hooks 和 presentation 层的调用点。
5. 每个子目录下的 `__tests__/` 包含单元测试，改动后运行 `pnpm test:unit` 验证。
6. 打印相关逻辑分布在 application/print/ 和 presentation/print/ 两处，前者负责数据处理，后者负责 UI 渲染，不要混淆职责。
