# invitation 模块 Agent 指令

## 全局规则引用

本模块内改动仍以本模块边界与分层规则为先；但 UI（discrete / theme）、文案（i18n）与搜索（advanced_query，`ModernQueryBuilder`）规则统一遵循 `Rule.md`。

## 定位

`src/modules/invitation` 是邀请码管理的业务模块。它负责邀请码的创建、编辑备注、删除、列表查询，以及邀请记录的分页查询。模块体量小，逻辑集中在 CRUD 操作上，没有复杂的领域规则。

## 目录与职责

```
invitation/
├── domain/           # 领域类型（InvitationCode, InvitationRecord, EditRemarkDTO）
├── application/      # 应用层（service 编排、models 类型重导出、constants、Vue Query hooks）
├── infrastructure/   # 仓储实现（invitation-repository，调用 /invitation 和 /invitation_record 端点）
├── presentation/     # 页面组件（InvitationCodePage.vue）
```

## 依赖约束

### 允许

- `import` shared 模块的通用能力（`useRequest`、`IPage`、`BasePageRequest`、`createPrefixedEndpoints`、`formatted`、`mapper-utils`、`legacy-query-adapter`）。
- application 层可依赖 `@tanstack/vue-query` 和 `@/app/infrastructure/query/query-request-context`。
- presentation 层可依赖 Naive UI、vue-i18n、Vue 核心 API。

### 禁止

- 禁止 `import` 其他业务模块（`contract`、`access`、`organization` 等）。
- domain 层禁止依赖 infrastructure、presentation、任何框架实现。
- 禁止在 domain 层引入 Vue、axios、Naive UI 等框架 API。
- 禁止其他业务模块直接 `import` invitation 内部实现；如需共享能力应提升到 shared。

## 修改本模块的规则

1. domain 层保持纯 TypeScript 类型，不引入框架依赖。
2. 新增 API 端点时在 `infrastructure/invitation-repository.ts` 中添加，通过 `createPrefixedEndpoints` 生成路径。
3. service 层只做编排和类型适配，不放 UI 逻辑或直接 HTTP 调用。
4. Vue Query hooks 统一放在 `application/hooks/`，遵循 `use*Query` / `use*Mutation` 命名。
5. 修改后运行 `pnpm test:unit` 确认 `__tests__/` 下的用例通过。
6. 单次改动只修改本模块与必要的 shared 代码，不顺手改其他模块。
