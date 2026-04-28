Status: completed
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# Service Agreement Search-First Entry Implementation Plan

**Goal:** 将备案/签约入口保留在高级搜索体系内，通过在 `ModernQueryBuilder` 中增加 `公司名称 + PCA` 字段实现先查重再新增，并支持基于路由 query 的通用预填与刷新后恢复搜索状态。

**Architecture:** shared `advanced-query` 扩展 `PCA` 字段类型并复用 `PCACascader`；页面层继续以 `ModernQueryBuilder` 为唯一查询入口，配合 `useListQueryState` 维护查询与分页；`service-agreement` 应用层提供 query/prefill 映射工具，负责 URL 持久化与新增预填；查询 Hook 新增可选 `enabled`，保证首屏无参数时不触发默认分页请求。

**Tech Stack:** Vue 3 Composition API、TSX、Vue Router 4、@tanstack/vue-query、Vitest、Naive UI。

---

### Task 1: 为分页 Hook 增加可选 enabled

**Files:**
- Modify: `src/modules/service-agreement/application/hooks/useSignService.ts`
- Test: `src/modules/service-agreement/application/hooks/__tests__/useSignService.spec.ts`

**Step 1: Write the failing test**
- 为 `useServiceAgreementPage` 增加一条测试：传入 `enabled = ref(false)` 时，query options 中暴露的 `enabled.value` 为 `false`。

**Step 2: Run test to verify it fails**
- Run: `pnpm vitest run src/modules/service-agreement/application/hooks/__tests__/useSignService.spec.ts`
- Expected: FAIL，因为当前 Hook 不接收 `enabled`。

**Step 3: Write minimal implementation**
- 将 `useServiceAgreementPage` 签名扩展为可选第二参数 `enabled?: Ref<boolean>`。
- 默认值保持 `true`，兼容 `UserProfileView` 等现有调用方。
- 将该 `enabled` 透传到 `useQuery` 配置中。

**Step 4: Run test to verify it passes**
- Run: `pnpm vitest run src/modules/service-agreement/application/hooks/__tests__/useSignService.spec.ts`
- Expected: PASS。

### Task 2: 新增应用层高级查询 route/prefill 映射工具

**Files:**
- Create: `src/modules/service-agreement/application/entry-search.ts`
- Test: `src/modules/service-agreement/application/__tests__/entry-search.spec.ts`

**Step 1: Write the failing test**
- 为以下行为编写测试：
  - 从页面查重表单生成分页查询条件（公司名称 + PCA 为必填基础条件）
  - 将查重状态与表单值序列化为路由 query
  - 从路由 query 恢复查重表单值与“是否已搜索”状态
  - 从路由 query 提取通用预填对象（仅提取白名单字段，忽略空值）

**Step 2: Run test to verify it fails**
- Run: `pnpm vitest run src/modules/service-agreement/application/__tests__/entry-search.spec.ts`
- Expected: FAIL，因为文件与函数尚不存在。

**Step 3: Write minimal implementation**
- 在应用层新增纯函数：
  - 创建默认查重表单模型
  - 构建页面分页查询条件
  - 构建/解析页面 route query
  - 构建/解析详情页预填 query
- 所有函数只处理 plain object，不直接依赖 Vue Router 实例。

**Step 4: Run test to verify it passes**
- Run: `pnpm vitest run src/modules/service-agreement/application/__tests__/entry-search.spec.ts`
- Expected: PASS。

### Task 3: 在 AdvancedQuery 中集成查重入口并改造列表页

**Files:**
- Modify: `src/views/auth/ServiceAgreementPageView.tsx`
- Test: `src/views/auth/__tests__/ServiceAgreementPageView.spec.tsx`

**Step 1: Write the failing test**
- 为列表页增加测试覆盖：
  - 首屏无 query 时不渲染结果表格，展示“请先查询”提示
  - 触发查询后才启用分页 Hook
  - 查询无结果时展示新增按钮
  - 点击新增按钮跳转 `sign`，并带上通用预填 query
  - 页面可从 route query 恢复已搜索状态与查重条件

**Step 2: Run test to verify it fails**
- Run: `pnpm vitest run src/views/auth/__tests__/ServiceAgreementPageView.spec.tsx`
- Expected: FAIL，因为当前页面默认查询并且没有查重入口/新增按钮。

**Step 3: Write minimal implementation**
- 扩展 shared advanced-query 支持 `PCA` 字段类型，页面不再单独渲染额外搜索框。
- 页面使用 `ModernQueryBuilder + useListQueryState + useTypedRouter/useTypedRoute` 管理查询、分页和 URL 同步。
- 首屏无搜索状态时仅展示提示文案。
- 查询后才渲染结果区；无结果时仅在当前查询包含 `公司名称 + PCA` 时显示新增按钮。
- 新增按钮带上通用预填 query 跳转详情页。

**Step 4: Run test to verify it passes**
- Run: `pnpm vitest run src/views/auth/__tests__/ServiceAgreementPageView.spec.tsx`
- Expected: PASS。

### Task 4: 在详情页消费通用预填

**Files:**
- Modify: `src/views/auth/ServiceAgreementDetailView.tsx`
- Test: `src/views/auth/__tests__/ServiceAgreementDetailView.spec.tsx`

**Step 1: Write the failing test**
- 增加测试覆盖：
  - 新建场景下可从 route query 生成 `initialValue`
  - 已有 `id` 且详情返回数据时，以详情数据优先，不被 query 预填覆盖

**Step 2: Run test to verify it fails**
- Run: `pnpm vitest run src/views/auth/__tests__/ServiceAgreementDetailView.spec.tsx`
- Expected: FAIL，因为当前详情页不读取预填 query。

**Step 3: Write minimal implementation**
- 通过 `useTypedRoute` 获取 query。
- 调用应用层预填解析函数得到干净预填对象。
- 以“详情数据优先、预填兜底”的顺序生成 `ServiceAgreementForm` 的 `initialValue`。

**Step 4: Run test to verify it passes**
- Run: `pnpm vitest run src/views/auth/__tests__/ServiceAgreementDetailView.spec.tsx`
- Expected: PASS。

### Task 5: 运行聚合验证

**Files:**
- Verify: `src/modules/service-agreement/application/hooks/__tests__/useSignService.spec.ts`
- Verify: `src/modules/service-agreement/application/__tests__/entry-search.spec.ts`
- Verify: `src/views/auth/__tests__/ServiceAgreementPageView.spec.tsx`
- Verify: `src/views/auth/__tests__/ServiceAgreementDetailView.spec.tsx`

**Step 1: Run focused test suite**
- Run: `pnpm vitest run src/modules/service-agreement/application/hooks/__tests__/useSignService.spec.ts src/modules/service-agreement/application/__tests__/entry-search.spec.ts src/views/auth/__tests__/ServiceAgreementPageView.spec.tsx src/views/auth/__tests__/ServiceAgreementDetailView.spec.tsx`
- Expected: PASS。

**Step 2: Run related broader validation if needed**
- Run: `pnpm vitest run src/modules/service-agreement`
- Expected: PASS；若存在与本次改动无关的历史失败，记录后停止扩展修复。

**Step 3: Do not commit automatically**
- 本任务按用户要求只修改代码与测试，不执行 `git commit`。
