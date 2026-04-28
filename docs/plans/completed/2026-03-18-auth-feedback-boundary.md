Status: completed
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# 401/403 鉴权提示边界调整 Implementation Plan

**Goal:** 将 401/403 的默认鉴权/权限提示从 Query 全局错误处理迁移到统一请求封装侧，并保持 refresh、requestId、BusinessError 映射与 Query retry 行为不变。

**Architecture:** 在 `useRequest.ts` 所在请求编排层新增独立的 auth feedback 模块，专门处理最终 401/403 错误提示；`token-manager.ts` 继续只负责 token 生命周期与 refresh 并发控制；`useRequestPlugin.ts` 只保留 Query/Mutation 生命周期相关反馈。整个改造按 TDD 推进，优先保证“最终失败才提示”和“401/403 不再由 Query 层兜底”。

**Tech Stack:** TypeScript、Axios、@tanstack/vue-query v5、Vitest、Naive UI。

> **Note:** 根据仓库规则，本计划不包含 git commit / branch 步骤。

---

### Task 1: 为 request 侧 auth feedback 建立最小回归测试

**Files:**
- Create: `src/modules/shared/infrastructure/__tests__/request-auth-feedback.spec.ts`
- Modify: `src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts`

**Step 1: Write the failing test**

新增最小测试覆盖：

- `BusinessError.status === 401` 时会生成鉴权提示
- `BusinessError.status === 403` 时会生成权限提示
- 同一个 requestId / error key 的重复提示可被去重

在 `useRequest.behavior.spec.ts` 中先补一个失败用例，验证：

- `401` 且 refresh 最终失败时，会触发 auth feedback
- `401` 且 refresh 成功时，不会触发 auth feedback

**Step 2: Run tests to verify they fail**

- Run: `pnpm test:unit -- src/modules/shared/infrastructure/__tests__/request-auth-feedback.spec.ts src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts`
- Expected: FAIL，原因是 auth feedback 模块尚不存在，且 `useRequest` 还未接入。

**Step 3: Write minimal implementation**

- 新建独立 auth feedback 模块
- 先只支持：
  - 识别 `BusinessError.status` 为 `401/403`
  - 通过 `@/_utils/discrete_naive_api` 输出通知
  - 提供最小去重策略

**Step 4: Run tests to verify they pass**

- Run: `pnpm test:unit -- src/modules/shared/infrastructure/__tests__/request-auth-feedback.spec.ts src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts`
- Expected: PASS。

---

### Task 2: 将最终 401/403 提示接入 `useRequest.ts`

**Files:**
- Create: `src/modules/shared/infrastructure/request-auth-feedback.ts`
- Modify: `src/modules/shared/infrastructure/useRequest.ts`
- Modify: `src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts`
- Reuse: `src/modules/shared/infrastructure/__tests__/request-auth-feedback.spec.ts`

**Step 1: Write the failing test**

在 `useRequest.behavior.spec.ts` 中新增或补齐以下用例：

- `401` 首次失败、refresh 成功、replay 成功：不提示 auth feedback
- `401` 首次失败、refresh 失败：提示 auth feedback，并继续抛错
- `403` 响应：提示 auth feedback，并继续抛错

**Step 2: Run tests to verify they fail**

- Run: `pnpm test:unit -- src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts`
- Expected: FAIL，当前 `useRequest.ts` 尚未在最终失败路径触发 auth feedback。

**Step 3: Write minimal implementation**

在 `useRequest.ts` 中：

- 只在最终即将抛出错误前接入 auth feedback
- 不在 refresh 前提示
- 不改变：
  - `shouldRetryWithTokenRefresh(...)`
  - `shouldRefreshBeforeRetry(...)`
  - `throwMappedRequestError(...)`
  - requestId 透传

实现后满足：

- 只有最终失败的 401/403 才会提示
- refresh/replay 成功时不提示

**Step 4: Run tests to verify they pass**

- Run: `pnpm test:unit -- src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts src/modules/shared/infrastructure/__tests__/useRequest.request-id.spec.ts`
- Expected: PASS。

---

### Task 3: 从 Query 全局错误处理移除 401/403 默认提示职责

**Files:**
- Modify: `src/app/plugins/useRequestPlugin.ts`
- Modify: `src/app/plugins/__tests__/useRequestPlugin.spec.ts`

**Step 1: Write the failing test**

调整 `useRequestPlugin.spec.ts`，明确新的契约：

- Query 层默认错误提示不再因为 `403` 而特殊兜底
- 非 auth 类错误提示逻辑保持不变
- query retry、success toast、`skipGlobalErrorHandler` 保持不变

需要修改的现有测试包括：

- 原 `queryCache onError still shows toast for 403 when query has no cached data`
  - 改成断言：默认不再由 Query 层负责这类提示

**Step 2: Run tests to verify they fail**

- Run: `pnpm test:unit -- src/app/plugins/__tests__/useRequestPlugin.spec.ts`
- Expected: FAIL，当前 Query 层仍会对 403 做默认提示。

**Step 3: Write minimal implementation**

在 `useRequestPlugin.ts` 中：

- 去掉 `403` 的默认特殊兜底逻辑
- 保留：
  - 有缓存数据时的 query 后台刷新失败提示
  - 非 auth 类业务错误提示
  - mutation success/error 提示
  - retry 规则

**Step 4: Run tests to verify they pass**

- Run: `pnpm test:unit -- src/app/plugins/__tests__/useRequestPlugin.spec.ts`
- Expected: PASS。

---

### Task 4: 同步请求链路文档

**Files:**
- Modify: `docs/explanation/modules/access/request-auth-refresh.md`
- Modify: `docs/plans/2026-03-18-auth-feedback-boundary-design.md`

**Step 1: Write the failing test**

文档检查项：

- 主文档需反映新边界：
  - 401/403 默认提示由 request 侧负责
  - Query 层不再兜底 auth feedback
- 设计文档需补充落地状态

**Step 2: Run verification to identify stale wording**

- Run: `rg -n "403.*Query|401.*Query|鉴权提示|auth feedback|useRequestPlugin" docs/explanation/modules/access/request-auth-refresh.md docs/plans/completed/2026-03-18-auth-feedback-boundary-design.md`
- Expected: 能定位需要更新的文案段落。

**Step 3: Write minimal implementation**

- 更新主文档里的职责边界说明
- 在设计文档中补充“已落地状态”和最终职责归属

**Step 4: Verify the docs read coherently**

- Run: `rg -n "^# |^## " docs/explanation/modules/access/request-auth-refresh.md docs/plans/completed/2026-03-18-auth-feedback-boundary-design.md`
- Expected: 文档结构完整、无残缺章节。

---

### Task 5: 最终验证

**Files:**
- Verify only

**Step 1: Run focused unit tests**

- Run: `pnpm test:unit -- src/modules/shared/infrastructure/__tests__/request-auth-feedback.spec.ts src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts src/modules/shared/infrastructure/__tests__/useRequest.request-id.spec.ts src/app/plugins/__tests__/useRequestPlugin.spec.ts`
- Expected: PASS。

**Step 2: Run type verification**

- Run: `pnpm type-check`
- Expected: PASS。

**Step 3: Run final sanity scan**

- Run: `rg -n "401|403|toastOnError|skipGlobalErrorHandler" src/modules/shared/infrastructure/useRequest.ts src/modules/shared/infrastructure/request-auth-feedback.ts src/app/plugins/useRequestPlugin.ts`
- Expected: 结果与目标边界一致：
  - auth feedback 入口位于 request 侧
  - Query 层不再承担 401/403 默认提示职责

---

## 参考

- `docs/explanation/modules/access/request-auth-refresh.md`
- `docs/plans/2026-03-18-auth-feedback-boundary-design.md`
- `src/modules/shared/infrastructure/useRequest.ts`
- `src/modules/access/application/token-manager.ts`
- `src/app/plugins/useRequestPlugin.ts`
