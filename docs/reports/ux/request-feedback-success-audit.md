Status: historical
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# 成功反馈 UX 盘点（Mutation）

> 目标：把“每个 Mutation 成功后用户能看到什么”明确下来，避免 **无反馈**、**重复反馈**、以及“随手加 toast”导致的噪音。
>
> 背景改造：全局 success toast 已改为 **opt-in**（默认不提示，仅 `meta.toastOnSuccess` 显式开启才提示）。详见：
>
> - `docs/explanation/architecture/request-feedback-success-toast.md`
> - `src/app/plugins/useRequestPlugin.ts`

---

## 盘点口径

我们把成功反馈分为三类：

1. **Meta 全局 toast（opt-in）**：通过 `meta.toastOnSuccess` 触发 `notification.success(...)`。
2. **页面局部 message/notification**：调用点（页面/组件）里 `message.success(...)` 或 `notification.success(...)`。
3. **UI 自证成功（静默）**：成功后立即跳转、进入下一步、或页面状态本身就是成功反馈（例如 Result 页/步骤条/状态 Tag 变化）。

> 原则：同一个动作成功后，尽量只保留一种“主反馈”，避免重复。

---

## 总览（按模块）

### Captcha

- ✅ **发送短信验证码**  
  - Hook：`src/modules/captcha/application/hooks/useSMS.ts` → `sendSMSCode()`  
  - 触发：`RegisterView.tsx` / `PasswordRecoveryView.tsx`  
  - 成功反馈：**Meta 全局 toast（opt-in）**（`auth.sms.sentSuccess`）  
  - 理由：结果不一定在 UI 立刻可见（短信是否发出），toast 属于必要确认。

### Auth / User（未登录）

- ✅ **注册**  
  - Hook：`src/modules/user/application/hooks/useRegister.ts` → `useRegister()`  
  - 触发：`RegisterView.tsx`  
  - 成功反馈：**Meta 全局 toast（opt-in）**（`auth.register.success`） + 跳转登录页  
  - 理由：跳转登录页不一定能让用户确认“注册已成功”，toast 用来消除歧义。

- ✅ **登录（含 OAuth2 / 2FA 流程）**  
  - Hook：`src/modules/user/application/hooks/useLogin.ts` → `useLogin()`  
  - 触发：`LoginView.tsx`  
  - 成功反馈：**UI 自证成功（静默）**（进入 2FA 或 Dashboard）  
  - 理由：流程强交互且下一步就是成功结果，不需要额外 toast。

- ✅ **找回密码 / 重置密码**  
  - Hook：`src/modules/user/application/hooks/usePassword.ts` → `usePasswordRecovery()`  
  - 触发：`PasswordRecoveryView.tsx`  
  - 成功反馈：**页面局部 message**（hook 内 `message.success(...)`） + 跳转登录页  
  - 理由：这是“强确认”动作，且页面已有明确文案与回跳。

### User（已登录）

- ✅ **修改密码**  
  - Hook：`src/modules/user/application/hooks/useChangePassword.ts` → `useChangePassword()`  
  - 触发：`UserSettingsView.vue`  
  - 成功反馈：**页面局部 message**（保存成功 + 退出登录）  
  - 理由：局部交互更贴近上下文，且后续强制退出登录已提供充分反馈。

- ✅ **撤销设备会话**  
  - Hook：`src/modules/user/application/hooks/useUserDevices.ts` → `useRevokeCurrentUserDevicesMutation()`  
  - 触发：`UserSettingsView.vue`  
  - 成功反馈：**页面局部 message**（按 revokedCount / skippedCount 分支提示）  
  - 理由：需要按返回数据定制提示内容。

- ✅ **两步验证（TOTP）启用/禁用/重置备用码**  
  - Hook：`src/modules/user/application/hooks/useTotpManagement.ts`（setup/enable/disable/backupCodes）  
  - 触发：`TotpSettingsSection.vue`  
  - 成功反馈：**UI 自证成功（静默）**（步骤条推进、Modal 关闭、状态 Tag 更新、备用码展示）  
  - 理由：用户“就在这个流程里”，UI 本身就是反馈。

- ✅ **补全用户信息提审**  
  - Hook：`src/modules/user/application/hooks/useUserAdditionalInfoRequest.ts` → `useUserAdditionalInfoRequest()`  
  - 触发：`UserAdditionalInfoView.vue`  
  - 成功反馈：**UI 自证成功（静默）**（跳转 `UserAdditionalInfoPendingView.vue` 的 Result）  
  - 理由：成功后有明确“已提审”的页面状态。

### Approval

- ✅ **领取任务 / 审批通过/拒绝 / 撤销实例**  
  - Hook：`src/modules/approval/application/hooks/useApprovalService.ts`  
  - 触发：`ApprovalInstancePage.vue` / `TemplateActions.tsx`  
  - 成功反馈：**Meta 全局 toast（opt-in）**（claim/approve/reject/cancel）  
  - 理由：操作后 UI 变化不一定立即可见（尤其是列表刷新/任务状态变化），toast 是必要确认；且多个入口复用同一反馈更合理。

### Invitation

- ✅ **邀请码创建 / 保存 / 删除**  
  - Hook：`src/modules/invitation/application/hooks/useInvitationService.ts`  
  - 触发：`InvitationCodePage.vue`  
  - 成功反馈：**Meta 全局 toast（opt-in）**  
  - 理由：页面操作是命令型（CRUD），但 UI 变化不一定足够“显眼”，统一 toast 能减少疑惑且避免在页面堆 message。

### Access（权限/角色）

- ✅ **角色分配（Assign Role）**  
  - Hook：`src/modules/access/application/hooks/useUserRoleService.ts` → `useAssignRoleToUsers()`  
  - 触发：`RoleAssign.vue`  
  - 成功反馈：**Meta 全局 toast（opt-in）**  
  - 理由：操作结果主要体现在“别的列表/别的上下文”，toast 是必要确认。

- ⚠️ **角色编辑（Edit Role）**（当前未发现业务入口）  
  - Hook：`src/modules/access/application/hooks/useRoleService.ts` → `useEditRole()`  
  - 现状：仅测试引用，暂无页面触发点  
  - 建议：若未来启用编辑入口，优先 **页面局部 message**（因为通常在表单里保存，UI 自证 + message 更自然）。

### Work Order

- ✅ **创建工单 / 回复 / 取消 / 完成 / 重开 / 拒绝 / 领取 / 释放 / 评分**  
  - Hooks：`src/modules/work-order/application/hooks/useWorkOrderService.ts`  
  - 触发：`WorkOrderCreateModal.vue` / `WorkOrderDetailPage.vue` / `WorkOrderScoreSection.vue`  
  - 成功反馈：**页面局部 message**（在 mutate 的 `onSuccess` 里提示）  
  - 理由：这些操作发生在强上下文页面里（详情页/弹窗），局部 message 最贴合，并且能配合表单清空、状态更新。

- ✅ **工单分类增删改**  
  - Hooks：`src/modules/work-order/application/hooks/useCategoryService.ts`  
  - 触发：`WorkOrderCategorySelect.tsx`  
  - 成功反馈：**页面局部 message**  
  - 理由：属于弹窗内操作，局部 message 足够且不会污染全局。

- ⚠️ **移出黑名单**（当前未发现业务入口）  
  - Hook：`src/modules/work-order/application/hooks/useWorkOrderService.ts` → `useRemoveBlacklist()`  
  - 现状：未搜到调用点  
  - 建议：等出现真实入口后再决定（一般会偏向页面局部 message）。

### Service Agreement（备案/签约）

- ✅ **附件上传**  
  - Hook：`src/modules/service-agreement/application/hooks/useSignService.ts` → `useUploadFileMutation()`  
  - 触发：`ImagesUploader.tsx`  
  - 成功反馈：**页面局部 message**（每个文件上传成功提示）  
  - 额外：hook 已显式 `meta.toastOnSuccess: false`，避免全局提示干扰上传体验。

- ✅ **提交备案 / 提交签约**  
  - Hook：`src/modules/service-agreement/application/hooks/useSignService.ts` → `useSubmitRecordMutation()` / `useSubmitSignMutation()`  
  - 触发：`ServiceAgreementDetailView.tsx`  
  - 成功反馈：**UI 自证成功（静默）**（跳转到 `SignResultView.tsx` 的 Result success）  
  - 理由：提交后进入结果页，本身就是成功反馈。

- ⚠️ **重名校验**（当前未发现业务入口）  
  - Hook：`src/modules/service-agreement/application/hooks/useSignService.ts` → `useDuplicateCheckMutation()`  
  - 建议：通常这种属于表单内校验，优先“表单字段级反馈”，不应做全局 toast。

---

## 检查清单（以后新增 mutation 时）

新增/改动 mutation 时，按顺序问自己：

1. 成功后用户能不能 **立刻在 UI 看出来**？能 → 静默或局部 message；不能 → 考虑 meta toast。
2. 这个动作是否会在多个页面复用，且都需要同一条成功确认？是 → 更适合放在 Hook 的 `meta.toastOnSuccess`。
3. 页面里是否已经 `message.success(...)`？是 → 不要再开 `meta.toastOnSuccess`（避免重复）。
