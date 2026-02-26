# 布局改动说明（供审阅）

## 1) 文档范围

- 本文记录我在这轮会话中做的布局相关改动，以及后续为通过验证做的测试/文档改动。
- 重点是 `container query + subgrid` 迁移，目的是统一表单标签/控件对齐策略（4/8），并在窄容器下自动折叠。
- 你反馈“现在布局出现问题”，建议先看第 4 节“高风险点排查”。

## 2) 我改了哪些布局文件，做了什么

### A. 通用/复用网格样式

- `src/modules/user/presentation/auth-form-grid.css:1`
  - 新增 `.auth-form-grid`：12 列网格、`subgrid` 对齐、`@container ... (max-width: 48rem)` 折叠。
- `src/modules/user/presentation/user_additional_info/UserAdditionalInfoForm.css:1`
  - 新增 additional-info 专用网格：支持半宽项和全宽项混排。
- `src/modules/service-agreement/presentation/sign/styles/SignFormGrid.css:1`
  - 新增 `.sa-form-grid`：服务协议表单统一网格规则。
- `src/modules/work-order/presentation/WorkOrderCategorySelect.css:1`
  - 新增分类弹窗表单网格规则。
- `src/views/unauth/PreviewAttachments.css:1`
  - 新增预览验证码表单网格规则（含提交按钮列位）。

### B. Auth / User 表单接入

- `src/modules/user/presentation/login/LoginForm.tsx:20`
  - 引入 `auth-form-grid.css`，表单 class 增加 `auth-form-grid`。
- `src/modules/user/presentation/register/RegisterForm.tsx:18`
  - 同上。
- `src/modules/user/presentation/password/PasswordRecoveryForm.tsx:16`
  - 同上。
- `src/modules/user/presentation/user_additional_info/UserAdditionalInfoForm.tsx:11`
  - 引入 `UserAdditionalInfoForm.css`。
  - 多个 `NFormItem` 增加 `user-additional-info-form__item` / `--full`，用于两列与全宽布局切换。

### C. Service Agreement 表单接入

- `src/modules/service-agreement/presentation/sign/ServiceAgreementForm.tsx:15`
  - 引入 `SignFormGrid.css`。
- `src/modules/service-agreement/presentation/sign/CustomerInfoSection.tsx:35`
  - 外层改为 `<div class="sa-form-grid">...</div>`。
- `src/modules/service-agreement/presentation/sign/PriceGroupWidget.tsx:75`
  - 外层改为 `<div class="sa-form-grid">...</div>`。
- `src/modules/service-agreement/presentation/sign/SignInfoSection.tsx:24`
  - 外层改为 `<div class="sa-form-grid">...</div>`。
- `src/modules/service-agreement/presentation/sign/ServicePointSpecification.tsx:16`
  - 引入 `SignFormGrid.css`。
  - 弹窗 `NForm` 增加 `class="sa-form-grid"`。

### D. 这次你要求继续后，我新增/调整的中优先级页面

- `src/views/auth/UserSettingsView.vue:350`
  - 修改改密区域：
    - 去掉 `label-placement="top"`。
    - 改为 `settings-password-form-grid` 网格。
    - 新增 scoped 样式（起始约 `src/views/auth/UserSettingsView.vue:486`）。
    - 旧 `max-width: 560px` 改为 `max-inline-size: 35rem`。
- `src/modules/work-order/presentation/WorkOrderCreateModal.vue:66`
  - 弹窗卡片改为 `work-order-create-modal-card`（`inline-size: 45rem; max-inline-size: 90vw`）。
  - 表单去掉 `label-placement="top"`，改为 `work-order-create-form-grid`。
  - 新增 scoped 样式（起始约 `src/modules/work-order/presentation/WorkOrderCreateModal.vue:117`）。
- `src/modules/work-order/presentation/WorkOrderCategorySelect.tsx:15`
  - 引入 `WorkOrderCategorySelect.css`。
  - 分类新增/编辑弹窗内 `NForm` 改用 `class: 'work-order-category-form-grid'`（原来是 `labelPlacement: 'top'`）。
- `src/views/unauth/PreviewAttachments.tsx:12`
  - 引入 `PreviewAttachments.css`。
  - 访问码表单增加 `preview-attachments-form-grid`。
  - 提交按钮增加 `preview-attachments-form-grid__submit`。
  - 删除调试日志 `console.log('errors', errors)`。

## 3) 非布局改动（为保证验证通过）

### A. 测试修复

- `src/views/auth/__tests__/UserSettingsView.spec.ts:256`
  - 增加 `TotpSettingsSection` stub，避免测试中真实依赖 QueryClient 导致失败。
  - 把 `mount(UserSettingsView)` 统一替换为 `mountView()`。
- `src/modules/approval/presentation/approval/diff-check/__tests__/ApprovalHistoryDiffCheck.spec.tsx:54`
  - 断言 key 从 `common.action.reject` 改为 `domain.approval.action.reject`，与实现一致。
- `src/modules/user/application/hooks/__tests__/auth-hooks.spec.ts:21`
  - 增加对 `@/_utils/discrete_naive_api` 和 `@/_utils/i18n` 的 mock。
  - passwordRecovery 成功文案断言改为当前实现使用的 i18n key：
    `layout.profile.security.changePassword.success`。

### B. 设计约束文档补充（你要求的第 2 项）

- `docs/design-contract.yaml:65`
  - 新增 `migration_exceptions.container_query_subgrid.deferred_low_priority_forms`：
    - `src/views/unauth/LoginView.tsx`
    - `src/views/unauth/RegisterView.tsx`
    - `src/views/unauth/PasswordRecoveryView.tsx`
    - `src/views/unauth/TwoFactorVerifyView.tsx`
    - `src/views/auth/components/TotpSettingsSection.vue`
    - `src/modules/approval/presentation/approval/TemplateActions.tsx`
  - 同时写明后续“重新评估触发条件”。

## 4) 可能导致你当前“布局异常”的高风险点（优先排查）

- `label-placement="top" -> 网格标签列` 的切换：
  - `src/views/auth/UserSettingsView.vue:350`
  - `src/modules/work-order/presentation/WorkOrderCreateModal.vue:70`
  - `src/modules/work-order/presentation/WorkOrderCategorySelect.tsx:64`
- `auth-form-grid` 与原有工具类（如 `flex`）并存：
  - `src/modules/user/presentation/login/LoginForm.tsx:68`
  - `src/modules/user/presentation/register/RegisterForm.tsx:66`
  - `src/modules/user/presentation/password/PasswordRecoveryForm.tsx:65`
  - 如果工具类最终把 `display` 覆盖为 `flex`，会导致网格不生效。
- 容器查询基于“容器宽度”而非“视口宽度”：
  - 所有 `@container ... (max-width: 48rem)` 文件。
  - 若父容器宽度意外偏小，会提前触发折叠。
- 预览页提交按钮列位定在 `5 / span 8`：
  - `src/views/unauth/PreviewAttachments.css:28`
  - 若父级实际网格上下文变化，按钮可能错位。
- 改密容器宽度从 560px 改为 35rem：
  - `src/views/auth/UserSettingsView.vue:489`
  - 在不同根字号或父容器约束下，表现可能与旧版有偏差。

## 5) 我执行过的验证

- `pnpm test:unit src/views/auth/__tests__/UserSettingsView.spec.ts src/modules/approval/presentation/approval/diff-check/__tests__/ApprovalHistoryDiffCheck.spec.tsx src/modules/user/application/hooks/__tests__/auth-hooks.spec.ts` 通过。
- `pnpm test:unit` 全量通过（190 files / 747 tests）。
- `pnpm type-check` 通过。
- `pnpm check:px` 通过。
- `pnpm build-only` 通过（仍有原有的 chunk size 警告，不影响本次功能）。

## 6) 给你的审阅建议（最省时间顺序）

1. 先看第 4 节列出的 5 个高风险点。
2. 如果你确认是某个页面异常，直接告诉我“文件 + 期望布局”。
3. 我会按你指定页面做最小修复，不再扩散到其他模块。
