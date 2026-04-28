Status: active
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# Views 单测条例清单

## 说明

- 范围：`src/views/**/__tests__` 当前保留的测试文件。
- 标准：只保留高价值用例（业务分支、状态分支、路由副作用、异常路径），剔除纯外壳/重复断言。
- 统计：共 16 个测试文件，81 条测试用例。

## 有意不测的页面

| 页面 | 原因 |
|------|------|
| `403View` / `404View` / `500View` | 静态错误页，逻辑仅按钮跳转 |
| `ApprovalInstancePageView` | 纯 wrapper，仅透传子页面 |
| `AuthLayoutView (.vue)` | 旧版布局，测试已收敛到 `.tsx` 主链路 |
| `DashboardView` | 当前为空模板占位壳 |
| `ErrorBoundaryDemoView` | 演示用途，非核心业务路径 |
| `InvitationPageView` | 纯 wrapper，仅透传子页面 |
| `UnauthLayoutView` | 布局壳组件，逻辑极薄 |

## 测试文件与条例

### `LayoutView.spec.ts`

| 条例 | 覆盖边界 |
|------|----------|
| shows loading spinner when authenticated user data is not loaded | 加载态 |
| uses unauth layout when route meta.layout is unauth | 常规渲染 |
| uses auth layout when route meta.layout is auth | 常规渲染 |
| falls back to unauth layout when requiresAuth is false | 兜底分支 |
| falls back to auth layout when requiresAuth is missing | 缺参 |

### `ApprovalDetailView.spec.ts`

| 条例 | 覆盖边界 |
|------|----------|
| renders error result when instanceId is invalid | 非法参数 |
| renders error result when template is missing | 缺参 |
| renders approval template with parsed instance id and template | 常规渲染 |

### `AuthLayoutViewTsx.spec.tsx`

| 条例 | 覆盖边界 |
|------|----------|
| adds current route tab on mount and renders router content | 常规渲染 |
| handles dropdown actions for locale, theme and user menu | 主流程正向 |
| navigates by sidebar menu and closes active tab to next path | 路由副作用 |
| switches active tab and routes when tab body is clicked | 路由副作用 |

### `LayoutSideBar.spec.ts`

| 条例 | 覆盖边界 |
|------|----------|
| converts auth routes to menu options and binds initial menu state | 路由副作用 |
| toggles collapsed status, width style and icon when toggle button clicked | 状态切换 |
| updates selection and expands option when route name changes | 状态切换 |

### `ServiceAgreementDetailView.spec.tsx`

| 条例 | 覆盖边界 |
|------|----------|
| submits record mutation when status is Record and validation passes | 主流程正向 |
| submits sign mutation when status is Sign | 主流程正向 |
| skips submit when validation fails | 异常分支 |
| calls print helper with fixed printable id | 常规渲染 |
| pushes sign-result route when record callback is triggered | 路由副作用 |
| pushes sign-result route when sign callback is triggered | 路由副作用 |
| renders hidden UnifiedFormPrint when initial detail exists | 常规渲染 |
| does not render UnifiedFormPrint when detail data is null | 空值 |

### `ServiceAgreementPageView.spec.tsx`

| 条例 | 覆盖边界 |
|------|----------|
| passes table data and loading state to ServiceAgreementPage | 加载态 |
| clicking search button calls refetch | 常规渲染 |
| edit action navigates to sign route with mode and id | 路由副作用 |
| detail action navigates to sign route with detail mode | 路由副作用 |
| skips id in query when current row id is missing | 缺参 |

### `SignResultView.spec.tsx`

| 条例 | 覆盖边界 |
|------|----------|
| renders invalid params state when route query is missing | 非法参数 |
| navigates to sign detail when status is Record and view is clicked | 路由副作用 |
| navigates to approval detail when status is Sign and view is clicked | 路由副作用 |
| shows message error when status does not match supported branches | 异常分支 |

### `UserAdditionalInfoPendingView.spec.ts`

| 条例 | 覆盖边界 |
|------|----------|
| renders loading skeleton when status query is loading | 加载态 |
| renders error state and handles back/retry actions | 异常分支 |
| navigates to approval detail using route query instanceId when present | 路由副作用 |
| uses latest status instance id when route query instanceId is missing | 缺参 |
| redirects to profile immediately when latest status is terminal | 路由副作用 |

### `UserAdditionalInfoView.spec.ts`

| 条例 | 覆盖边界 |
|------|----------|
| redirects to pending page immediately when status is approving | 状态（进行中） |
| renders loading skeleton when pageStatus is loading | 加载态 |
| renders editable form when pageStatus is visible | 常规渲染 |
| submits converted payload when save is clicked and validation passes | 主流程正向 |
| skips submit when validation has errors | 异常分支 |
| navigates back to profile when back button is clicked | 路由副作用 |
| handles request success callback by refetching and jumping pending page | 状态（进行中） |

### `UserProfileView.spec.ts`

| 条例 | 覆盖边界 |
|------|----------|
| renders loading skeleton when profile page status is loading | 加载态 |
| renders approval result when page status is approving | 状态（进行中） |
| jumps to approval detail when instance id exists | 路由副作用 |
| falls back to approval list when instance id is unavailable | 兜底分支 |
| renders detail form and supports edit navigation in visible status | 常规渲染 |
| shows avatar upload tip on avatar and camera button clicks | 常规渲染 |
| logs out and clears tabs before routing to login | 常规渲染 |

### `UserSettingsView.spec.ts`

| 条例 | 覆盖边界 |
|------|----------|
| handles theme and language changes via select components | 主流程正向 |
| submits change password success path and redirects to login | 路由副作用 |
| shows error message when change password returns false | 异常分支 |
| refreshes device list via refresh action | 常规渲染 |
| warns when revoking without selected devices | 缺失输入 |
| revokes selected devices after dialog confirmation | 常规渲染 |
| handles 2FA and dangerous delete actions | 主流程正向 |

### `LoginView.spec.tsx`

| 条例 | 覆盖边界 |
|------|----------|
| submits local login with converted payload and latest captchaKey | 主流程正向 |
| refreshes captcha when captcha area is clicked | 常规渲染 |
| processes oauth2 token message from trusted origin and closes popup | 常规渲染 |
| shows oauth error notification when callback url indicates failure | 异常分支 |
| ignores message from unknown origin | 抑制分支 |
| navigates to password recovery and register pages | 路由副作用 |

### `Oauth2CallbackView.spec.ts`

| 条例 | 覆盖边界 |
|------|----------|
| posts token message to opener when token exists | 常规渲染 |
| shows error title when error query exists and skips token post | 异常分支 |

### `PasswordRecoveryView.spec.tsx`

| 条例 | 覆盖边界 |
|------|----------|
| navigates back to login when clicking back action | 路由副作用 |
| warns when sending sms code without phone | 缺失输入 |
| sends sms code when phone exists | 主流程正向 |
| shows error and blocks submit when passwords mismatch | 一致性 |
| submits password recovery payload with trim and sms bizId | 主流程正向 |

### `PreviewAttachments.spec.tsx`

| 条例 | 覆盖边界 |
|------|----------|
| renders access result panel when preview data is missing | 缺参 |
| enables preview query when validation passes and access button is clicked | 主流程正向 |
| keeps preview query disabled when validation has errors | 异常分支 |
| maps old files to undefined for FORM_VIEW when oldFiles are absent | 常规渲染 |
| maps old files to null for APPROVAL_VIEW when oldFiles are absent | 空值 |

### `RegisterView.spec.tsx`

| 条例 | 覆盖边界 |
|------|----------|
| warns when sending sms code without phone | 缺失输入 |
| sends sms code when phone exists | 主流程正向 |
| shows error and blocks submit when passwords mismatch | 一致性 |
| submits register payload with trim and sms bizId | 主流程正向 |
| navigates to login page from footer link | 路由副作用 |

## 执行建议

- 本清单可作为后续回归测试审阅基线。
- 新增测试时请遵循同一标准：优先业务核心分支，避免为纯展示壳添加单测。
