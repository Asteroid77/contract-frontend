# Auth Session Recovery Boundary Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在保持 request auth feedback 仅负责提示的前提下，引入独立的 auth session recovery 协调层，负责最终 401 认证失败后的 session 清理。

**Architecture:** `useRequest` 在最终映射出 `BusinessError` 后，先执行 auth feedback，再执行 auth session recovery。session recovery 本身不做 UI 跳转，只负责清理 session；登录页跳转继续复用 `AUTH_SESSION_CLEARED_EVENT -> router` 现有链路。403 保持只提示、不清 session。

**Tech Stack:** Vue 3, Pinia, Axios, TanStack Query, Vitest

---

### Task 1: 为 useRequest 增加 session recovery 行为测试

**Files:**
- Modify: `src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts`

**Step 1: Write the failing test**
- 为最终 401 增加 `recoverAuthSession` 调用断言
- 为 403 增加“不触发 recovery”断言

**Step 2: Run test to verify it fails**
Run: `pnpm exec vitest run src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts`
Expected: FAIL，因为 recovery 模块尚不存在或尚未接入

**Step 3: Write minimal implementation**
- 新增 recovery 模块 mock 接口所需实现
- 在 `useRequest.ts` 中接入 recovery

**Step 4: Run test to verify it passes**
Run: `pnpm exec vitest run src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts`
Expected: PASS

### Task 2: 为 auth session recovery 模块补单元测试

**Files:**
- Create: `src/modules/access/application/__tests__/auth-session-recovery.spec.ts`
- Create: `src/modules/access/application/auth-session-recovery.ts`

**Step 1: Write the failing test**
- 401 + 已有本地 session 时清理 session
- 403 不清理 session
- 无本地 session 时不做事
- 并发恢复时只执行一次清理

**Step 2: Run test to verify it fails**
Run: `pnpm exec vitest run src/modules/access/application/__tests__/auth-session-recovery.spec.ts`
Expected: FAIL，因为模块尚未实现

**Step 3: Write minimal implementation**
- 提供 `recoverAuthSession` 与错误判定函数
- 优先复用 `useAccountStore().clearSession()`
- 无 active pinia 时降级为 `clearAuthTokens()`
- 使用 in-flight promise 避免重复清理

**Step 4: Run test to verify it passes**
Run: `pnpm exec vitest run src/modules/access/application/__tests__/auth-session-recovery.spec.ts`
Expected: PASS

### Task 3: 更新主文档

**Files:**
- Modify: `docs/request-auth-refresh-architecture.md`

**Step 1: Update docs**
- 补充 `auth-session-recovery.ts` 的职责
- 明确 401 与 403 的边界
- 明确 request 层不直接做 router 跳转

**Step 2: Verify docs and related tests**
Run: `pnpm exec vitest run src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts src/modules/access/application/__tests__/auth-session-recovery.spec.ts src/modules/shared/infrastructure/__tests__/request-auth-feedback.spec.ts src/app/plugins/__tests__/useRequestPlugin.spec.ts && pnpm type-check`
Expected: PASS
