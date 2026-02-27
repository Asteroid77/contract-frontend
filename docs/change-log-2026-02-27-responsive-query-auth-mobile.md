# 变更文档：响应式布局与高级查询收束（2026-02-27）

> 范围：Auth 布局移动端改造、Advanced Query 主题语义收束、列表页查询状态抽取与移动文案统一。
> 目的：提供可检索的改动依据、影响面、验证结果与回滚锚点。

## 1. 背景与目标

- 统一移动端信息密度表现（面包屑/标签页替代、列表主副文本、按钮尺寸）。
- 清理反主题与反模式问题（无效 token、语义不稳定颜色、重复查询状态逻辑）。
- 将高级查询组件向 UI 库解耦推进到可扩展边界（ButtonLike / SelectLike）。

## 2. 主要改动（按能力分组）

### A. Auth 布局与移动端历史标签页

**变更点**

- 移动端隐藏中部面包屑与横向标签条，新增 Header 里的“当前标签 + 额外数量（`+N`）”入口。
- 新增右侧 Drawer，标题文案改为“历史标签页”，支持切换与关闭标签。
- 修正移动端遮罩色，避免使用文本语义 token 作为 scrim。
- PC 端面包屑补齐左侧间距；布局宽度统一走语义变量（如 `--layout-content-max-width`）。

**涉及文件**

- `src/views/auth/AuthLayoutView.tsx`
- `src/_utils/i18n/zh.ts`
- `src/_utils/i18n/en.ts`
- `src/views/auth/__tests__/AuthLayoutViewTsx.spec.tsx`

### B. 侧边栏尺寸 token 与 CSS 长度解析收敛

**变更点**

- 将侧栏宽度读取从旧变量名收敛到 `--sider-width` / `--sider-collapsed-width`。
- 新增 `parseCssLengthToPx`，统一处理 rem/px 到像素数值的转换，避免散落 `parseInt`。

**涉及文件**

- `src/app/presentation/layout/utils/cssLength.ts`（新增）
- `src/views/auth/LayoutSideBar.vue`
- `src/app/presentation/layout/auth/AuthHeaderLogo.vue`
- `src/views/auth/__tests__/LayoutSideBar.spec.ts`

### C. Advanced Query 解耦与主题语义统一

**变更点**

- `QueryActionButtons` 去掉 `NSpace`，改为轻量容器并统一左内边距。
- 引入 `ButtonLike` 作为按钮适配层；保留组件内高密度微控件继续使用原生 `button`。
- 引入 `SelectLike`，将 ENUM 单值/多值编辑从滚动按钮列表改为可筛选下拉。
- 高级查询内部交互颜色从 `accent` 迁移到主色语义/错误语义 token。
- 输入框增强自适应宽度（`size + fieldSizing`），降低截断与拥挤。

**涉及文件**

- `src/modules/shared/presentation/advanced-query/QueryActionButtons.tsx`
- `src/modules/shared/presentation/advanced-query/modern/ButtonLike.tsx`（新增）
- `src/modules/shared/presentation/advanced-query/modern/SelectLike.tsx`（新增）
- `src/modules/shared/presentation/advanced-query/modern/ModernQueryBuilder.tsx`
- `src/modules/shared/presentation/advanced-query/modern/FilterPill.tsx`
- `src/modules/shared/presentation/advanced-query/__tests__/QueryActionButtons.spec.tsx`
- `src/modules/shared/presentation/advanced-query/modern/__tests__/FilterPill.spec.tsx`

### D. 列表查询状态公共化 + 页面接入

**变更点**

- 抽取 `useListQueryState`，统一 `draft/applied` 查询状态、分页重置、同条件强制 refetch。
- 在用户/审批等列表页接入，去除重复的分页与查询状态模板代码。

**涉及文件**

- `src/modules/shared/presentation/advanced-query/useListQueryState.ts`（新增）
- `src/modules/shared/presentation/advanced-query/__tests__/useListQueryState.spec.ts`（新增）
- `src/modules/user/presentation/manage/UserListPage.tsx`
- `src/modules/approval/presentation/approval/ApprovalInstancePage.vue`

### E. 移动端列表主副文本统一 + 按钮尺寸规范

**变更点**

- 新增 `MobilePrimarySecondaryText` 统一移动端列表标题/副信息展示（默认最多 2 行副文本）。
- 角色、审批、邀请码、用户、工单列表接入统一组件，减少重复渲染模板。
- 相关操作按钮尺寸收敛为 `tiny`。

**涉及文件**

- `src/modules/shared/presentation/widget/MobilePrimarySecondaryText.tsx`（新增）
- `src/modules/shared/presentation/widget/__tests__/MobilePrimarySecondaryText.spec.tsx`（新增）
- `src/modules/access/presentation/role/RolePage.vue`
- `src/modules/approval/presentation/approval/ApprovalInstancePage.vue`
- `src/modules/invitation/presentation/invitation/InvitationCodePage.vue`
- `src/modules/user/presentation/manage/UserListPage.tsx`
- `src/modules/work-order/presentation/WorkOrderListPage.vue`

## 3. 主题与反模式收束记录

- 修复无效 token 使用：避免 `--color-text` 这类不存在变量，统一到 `--color-text-main/body/light/disabled`。
- 修复 scrim 语义：移动遮罩不再使用文本色 token。
- 修复样式语义不一致：删除按钮 hover 改用 `--color-semantic-error`。
- 修复重复逻辑：查询状态与移动主副文本抽为公共模块。

## 4. 验证记录

执行命令：

```bash
pnpm test:unit src/modules/shared/presentation/advanced-query/modern/__tests__/FilterPill.spec.tsx src/modules/shared/presentation/advanced-query/__tests__/useListQueryState.spec.ts src/views/auth/__tests__/AuthLayoutViewTsx.spec.tsx src/views/auth/__tests__/LayoutSideBar.spec.ts src/modules/work-order/presentation/__tests__/WorkOrderListPage.spec.ts src/modules/access/presentation/role/__tests__/RolePage.spec.ts src/modules/invitation/presentation/invitation/__tests__/InvitationCodePage.spec.ts src/modules/user/presentation/manage/__tests__/UserListPage.spec.tsx src/modules/approval/presentation/approval/__tests__/ApprovalInstancePage.spec.ts
```

验证结果：

- Test Files: 9 passed
- Tests: 31 passed

## 5. 风险与回滚锚点

- 风险点 1：移动端标签抽屉交互与 tab store 生命周期耦合。
  - 回滚锚点：`src/views/auth/AuthLayoutView.tsx` 中 `mobileTabsDrawerOpen` 相关逻辑。
- 风险点 2：ENUM 由按钮列表切到 Select，用户习惯与键盘交互存在迁移成本。
  - 回滚锚点：`src/modules/shared/presentation/advanced-query/modern/FilterPill.tsx` ENUM 分支。
- 风险点 3：公共 hook 接入后，若页面存在额外 refetch 约束，可能需局部覆盖。
  - 回滚锚点：`src/modules/shared/presentation/advanced-query/useListQueryState.ts` 与调用页接线。

## 6. 检索关键词

- `historyTabs`
- `mobileTabsDrawerOpen`
- `parseCssLengthToPx`
- `ButtonLike`
- `SelectLike`
- `useListQueryState`
- `MobilePrimarySecondaryText`
