# Views 单测条例清单（已收敛版）

## 文档说明
- 范围：`src/views/**/__tests__` 当前保留的测试文件。
- 目标：只保留高价值用例（业务分支、状态分支、路由副作用、异常路径），剔除纯外壳/重复断言。
- 统计：共 `16 个测试文件`，`81 条测试用例`。

## 价值判定结果（未新增测试的页面）
- `403View`：错误静态页，逻辑仅按钮跳转，已按低价值标准移除。
- `404View`：错误静态页，逻辑仅按钮跳转，已按低价值标准移除。
- `500View`：错误静态页，逻辑仅按钮跳转/刷新，已按低价值标准移除。
- `ApprovalInstancePageView`：纯 wrapper 组件，仅透传子页面，无本地业务逻辑。
- `AuthLayoutView`：旧版布局视图（.vue），当前主链路使用 .tsx 版本，测试已收敛到主链路。
- `DashboardView`：当前为空模板（占位壳），无可测业务逻辑。
- `ErrorBoundaryDemoView`：演示用途页面，非核心业务路径，按低价值标准移除。
- `InvitationPageView`：纯 wrapper 组件，仅透传子页面，无本地业务逻辑。
- `UnauthLayoutView`：布局壳组件，逻辑极薄，已按低价值标准移除。

## 测试文件与条例

### `src/views/__tests__/LayoutView.spec.ts`
- 条例 1：`shows loading spinner when authenticated user data is not loaded`
  - 测试情况：验证“shows loading spinner when authenticated user data is not loaded”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：状态边界（加载态渲染）。
- 条例 2：`uses unauth layout when route meta.layout is unauth`
  - 测试情况：验证“uses unauth layout when route meta.layout is unauth”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 3：`uses auth layout when route meta.layout is auth`
  - 测试情况：验证“uses auth layout when route meta.layout is auth”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 4：`falls back to unauth layout when requiresAuth is false`
  - 测试情况：验证“falls back to unauth layout when requiresAuth is false”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：兜底分支边界（默认策略选择）。
- 条例 5：`falls back to auth layout when requiresAuth is missing`
  - 测试情况：验证“falls back to auth layout when requiresAuth is missing”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：缺参边界（关键字段缺失）。

### `src/views/auth/__tests__/ApprovalDetailView.spec.ts`
- 条例 1：`renders error result when instanceId is invalid`
  - 测试情况：验证“renders error result when instanceId is invalid”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：非法参数边界（参数格式或语义不合法）。
- 条例 2：`renders error result when template is missing`
  - 测试情况：验证“renders error result when template is missing”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：缺参边界（关键字段缺失）。
- 条例 3：`renders approval template with parsed instance id and template`
  - 测试情况：验证“renders approval template with parsed instance id and template”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。

### `src/views/auth/__tests__/AuthLayoutViewTsx.spec.tsx`
- 条例 1：`adds current route tab on mount and renders router content`
  - 测试情况：验证“adds current route tab on mount and renders router content”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 2：`handles dropdown actions for locale, theme and user menu`
  - 测试情况：验证“handles dropdown actions for locale, theme and user menu”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：主流程正向边界（关键动作成功路径）。
- 条例 3：`navigates by sidebar menu and closes active tab to next path`
  - 测试情况：验证“navigates by sidebar menu and closes active tab to next path”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。
- 条例 4：`switches active tab and routes when tab body is clicked`
  - 测试情况：验证“switches active tab and routes when tab body is clicked”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。

### `src/views/auth/__tests__/LayoutSideBar.spec.ts`
- 条例 1：`converts auth routes to menu options and binds initial menu state`
  - 测试情况：验证“converts auth routes to menu options and binds initial menu state”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。
- 条例 2：`toggles collapsed status, width style and icon when toggle button clicked`
  - 测试情况：验证“toggles collapsed status, width style and icon when toggle button clicked”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：状态切换边界（UI/状态联动）。
- 条例 3：`updates selection and expands option when route name changes`
  - 测试情况：验证“updates selection and expands option when route name changes”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：状态切换边界（UI/状态联动）。

### `src/views/auth/__tests__/ServiceAgreementDetailView.spec.tsx`
- 条例 1：`submits record mutation when status is Record and validation passes`
  - 测试情况：验证“submits record mutation when status is Record and validation passes”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：主流程正向边界（关键动作成功路径）。
- 条例 2：`submits sign mutation when status is Sign`
  - 测试情况：验证“submits sign mutation when status is Sign”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：主流程正向边界（关键动作成功路径）。
- 条例 3：`skips submit when validation fails`
  - 测试情况：验证“skips submit when validation fails”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：异常分支边界（失败路径与提示）。
- 条例 4：`calls print helper with fixed printable id`
  - 测试情况：验证“calls print helper with fixed printable id”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 5：`pushes sign-result route when record callback is triggered`
  - 测试情况：验证“pushes sign-result route when record callback is triggered”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。
- 条例 6：`pushes sign-result route when sign callback is triggered`
  - 测试情况：验证“pushes sign-result route when sign callback is triggered”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。
- 条例 7：`renders hidden UnifiedFormPrint when initial detail exists`
  - 测试情况：验证“renders hidden UnifiedFormPrint when initial detail exists”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 8：`does not render UnifiedFormPrint when detail data is null`
  - 测试情况：验证“does not render UnifiedFormPrint when detail data is null”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：空值边界（数据为空或不存在）。

### `src/views/auth/__tests__/ServiceAgreementPageView.spec.tsx`
- 条例 1：`passes table data and loading state to ServiceAgreementPage`
  - 测试情况：验证“passes table data and loading state to ServiceAgreementPage”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：状态边界（加载态渲染）。
- 条例 2：`clicking search button calls refetch`
  - 测试情况：验证“clicking search button calls refetch”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 3：`edit action navigates to sign route with mode and id`
  - 测试情况：验证“edit action navigates to sign route with mode and id”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。
- 条例 4：`detail action navigates to sign route with detail mode`
  - 测试情况：验证“detail action navigates to sign route with detail mode”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。
- 条例 5：`skips id in query when current row id is missing`
  - 测试情况：验证“skips id in query when current row id is missing”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：缺参边界（关键字段缺失）。

### `src/views/auth/__tests__/SignResultView.spec.tsx`
- 条例 1：`renders invalid params state when route query is missing`
  - 测试情况：验证“renders invalid params state when route query is missing”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：非法参数边界（参数格式或语义不合法）。
- 条例 2：`navigates to sign detail when status is Record and view is clicked`
  - 测试情况：验证“navigates to sign detail when status is Record and view is clicked”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。
- 条例 3：`navigates to approval detail when status is Sign and view is clicked`
  - 测试情况：验证“navigates to approval detail when status is Sign and view is clicked”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。
- 条例 4：`shows message error when status does not match supported branches`
  - 测试情况：验证“shows message error when status does not match supported branches”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：异常分支边界（失败路径与提示）。

### `src/views/auth/__tests__/UserAdditionalInfoPendingView.spec.ts`
- 条例 1：`renders loading skeleton when status query is loading`
  - 测试情况：验证“renders loading skeleton when status query is loading”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：状态边界（加载态渲染）。
- 条例 2：`renders error state and handles back/retry actions`
  - 测试情况：验证“renders error state and handles back/retry actions”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：异常分支边界（失败路径与提示）。
- 条例 3：`navigates to approval detail using route query instanceId when present`
  - 测试情况：验证“navigates to approval detail using route query instanceId when present”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。
- 条例 4：`uses latest status instance id when route query instanceId is missing`
  - 测试情况：验证“uses latest status instance id when route query instanceId is missing”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：缺参边界（关键字段缺失）。
- 条例 5：`redirects to profile immediately when latest status is terminal`
  - 测试情况：验证“redirects to profile immediately when latest status is terminal”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。

### `src/views/auth/__tests__/UserAdditionalInfoView.spec.ts`
- 条例 1：`redirects to pending page immediately when status is approving`
  - 测试情况：验证“redirects to pending page immediately when status is approving”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：状态边界（进行中状态处理）。
- 条例 2：`renders loading skeleton when pageStatus is loading`
  - 测试情况：验证“renders loading skeleton when pageStatus is loading”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：状态边界（加载态渲染）。
- 条例 3：`renders editable form when pageStatus is visible`
  - 测试情况：验证“renders editable form when pageStatus is visible”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 4：`submits converted payload when save is clicked and validation passes`
  - 测试情况：验证“submits converted payload when save is clicked and validation passes”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：主流程正向边界（关键动作成功路径）。
- 条例 5：`skips submit when validation has errors`
  - 测试情况：验证“skips submit when validation has errors”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：异常分支边界（失败路径与提示）。
- 条例 6：`navigates back to profile when back button is clicked`
  - 测试情况：验证“navigates back to profile when back button is clicked”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。
- 条例 7：`handles request success callback by refetching and jumping pending page`
  - 测试情况：验证“handles request success callback by refetching and jumping pending page”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：状态边界（进行中状态处理）。

### `src/views/auth/__tests__/UserProfileView.spec.ts`
- 条例 1：`renders loading skeleton when profile page status is loading`
  - 测试情况：验证“renders loading skeleton when profile page status is loading”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：状态边界（加载态渲染）。
- 条例 2：`renders approval result when page status is approving`
  - 测试情况：验证“renders approval result when page status is approving”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：状态边界（进行中状态处理）。
- 条例 3：`jumps to approval detail when instance id exists`
  - 测试情况：验证“jumps to approval detail when instance id exists”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。
- 条例 4：`falls back to approval list when instance id is unavailable`
  - 测试情况：验证“falls back to approval list when instance id is unavailable”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：兜底分支边界（默认策略选择）。
- 条例 5：`renders detail form and supports edit navigation in visible status`
  - 测试情况：验证“renders detail form and supports edit navigation in visible status”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 6：`shows avatar upload tip on avatar and camera button clicks`
  - 测试情况：验证“shows avatar upload tip on avatar and camera button clicks”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 7：`logs out and clears tabs before routing to login`
  - 测试情况：验证“logs out and clears tabs before routing to login”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。

### `src/views/auth/__tests__/UserSettingsView.spec.ts`
- 条例 1：`handles theme and language changes via select components`
  - 测试情况：验证“handles theme and language changes via select components”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：主流程正向边界（关键动作成功路径）。
- 条例 2：`submits change password success path and redirects to login`
  - 测试情况：验证“submits change password success path and redirects to login”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。
- 条例 3：`shows error message when change password returns false`
  - 测试情况：验证“shows error message when change password returns false”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：异常分支边界（失败路径与提示）。
- 条例 4：`refreshes device list via refresh action`
  - 测试情况：验证“refreshes device list via refresh action”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 5：`warns when revoking without selected devices`
  - 测试情况：验证“warns when revoking without selected devices”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：缺失输入边界（用户未提供必要输入）。
- 条例 6：`revokes selected devices after dialog confirmation`
  - 测试情况：验证“revokes selected devices after dialog confirmation”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 7：`handles 2FA and dangerous delete actions`
  - 测试情况：验证“handles 2FA and dangerous delete actions”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：主流程正向边界（关键动作成功路径）。

### `src/views/unauth/__tests__/LoginView.spec.tsx`
- 条例 1：`submits local login with converted payload and latest captchaKey`
  - 测试情况：验证“submits local login with converted payload and latest captchaKey”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：主流程正向边界（关键动作成功路径）。
- 条例 2：`refreshes captcha when captcha area is clicked`
  - 测试情况：验证“refreshes captcha when captcha area is clicked”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 3：`processes oauth2 token message from trusted origin and closes popup`
  - 测试情况：验证“processes oauth2 token message from trusted origin and closes popup”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 4：`shows oauth error notification when callback url indicates failure`
  - 测试情况：验证“shows oauth error notification when callback url indicates failure”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：异常分支边界（失败路径与提示）。
- 条例 5：`ignores message from unknown origin`
  - 测试情况：验证“ignores message from unknown origin”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：抑制分支边界（条件不满足时不应继续执行）。
- 条例 6：`navigates to password recovery and register pages`
  - 测试情况：验证“navigates to password recovery and register pages”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。

### `src/views/unauth/__tests__/Oauth2CallbackView.spec.ts`
- 条例 1：`posts token message to opener when token exists`
  - 测试情况：验证“posts token message to opener when token exists”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 2：`shows error title when error query exists and skips token post`
  - 测试情况：验证“shows error title when error query exists and skips token post”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：异常分支边界（失败路径与提示）。

### `src/views/unauth/__tests__/PasswordRecoveryView.spec.tsx`
- 条例 1：`navigates back to login when clicking back action`
  - 测试情况：验证“navigates back to login when clicking back action”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。
- 条例 2：`warns when sending sms code without phone`
  - 测试情况：验证“warns when sending sms code without phone”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：缺失输入边界（用户未提供必要输入）。
- 条例 3：`sends sms code when phone exists`
  - 测试情况：验证“sends sms code when phone exists”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：主流程正向边界（关键动作成功路径）。
- 条例 4：`shows error and blocks submit when passwords mismatch`
  - 测试情况：验证“shows error and blocks submit when passwords mismatch”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：一致性边界（两次输入不一致）。
- 条例 5：`submits password recovery payload with trim and sms bizId`
  - 测试情况：验证“submits password recovery payload with trim and sms bizId”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：主流程正向边界（关键动作成功路径）。

### `src/views/unauth/__tests__/PreviewAttachments.spec.tsx`
- 条例 1：`renders access result panel when preview data is missing`
  - 测试情况：验证“renders access result panel when preview data is missing”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：缺参边界（关键字段缺失）。
- 条例 2：`enables preview query when validation passes and access button is clicked`
  - 测试情况：验证“enables preview query when validation passes and access button is clicked”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：主流程正向边界（关键动作成功路径）。
- 条例 3：`keeps preview query disabled when validation has errors`
  - 测试情况：验证“keeps preview query disabled when validation has errors”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：异常分支边界（失败路径与提示）。
- 条例 4：`maps old files to undefined for FORM_VIEW when oldFiles are absent`
  - 测试情况：验证“maps old files to undefined for FORM_VIEW when oldFiles are absent”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：常规渲染边界（基础展示与行为）。
- 条例 5：`maps old files to null for APPROVAL_VIEW when oldFiles are absent`
  - 测试情况：验证“maps old files to null for APPROVAL_VIEW when oldFiles are absent”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：空值边界（数据为空或不存在）。

### `src/views/unauth/__tests__/RegisterView.spec.tsx`
- 条例 1：`warns when sending sms code without phone`
  - 测试情况：验证“warns when sending sms code without phone”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：缺失输入边界（用户未提供必要输入）。
- 条例 2：`sends sms code when phone exists`
  - 测试情况：验证“sends sms code when phone exists”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：主流程正向边界（关键动作成功路径）。
- 条例 3：`shows error and blocks submit when passwords mismatch`
  - 测试情况：验证“shows error and blocks submit when passwords mismatch”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：一致性边界（两次输入不一致）。
- 条例 4：`submits register payload with trim and sms bizId`
  - 测试情况：验证“submits register payload with trim and sms bizId”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：主流程正向边界（关键动作成功路径）。
- 条例 5：`navigates to login page from footer link`
  - 测试情况：验证“navigates to login page from footer link”对应的业务/交互路径是否按预期执行。
  - 边界覆盖：路由副作用边界（目标路由与参数）。

## 执行建议
- 本清单可作为后续回归测试审阅基线。
- 新增测试时请遵循同一标准：优先业务核心分支，避免为纯展示壳添加单测。
