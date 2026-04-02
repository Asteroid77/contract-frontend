# Auth Feedback Dedupe Cooldown Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 `401/403` 的 auth feedback 引入 cause-level dedupe 与 cooldown，减少并发请求和短时间重复失败带来的提示风暴。

**Architecture:** 仅修改 `request-auth-feedback.ts` 的 key 生成与 cooldown 判定逻辑，不改 Query 通用错误层和 `showUniqueErrorNotification(...)` 的基础能力。`401` 使用固定 session-expired key，`403` 使用 code 级 key，并分别配置独立 cooldown。

**Tech Stack:** TypeScript, Vitest, Vue 3, Naive UI

---

### Task 1: 为 auth feedback 新行为补失败测试

**Files:**
- Modify: `src/modules/shared/infrastructure/__tests__/request-auth-feedback.spec.ts`

**Step 1: Write the failing test**
- 覆盖 `401/403` 新 key 规则
- 覆盖 cooldown 内只提示一次
- 覆盖 cooldown 过后可重新提示

**Step 2: Run test to verify it fails**
Run: `pnpm exec vitest run src/modules/shared/infrastructure/__tests__/request-auth-feedback.spec.ts`
Expected: FAIL，因为当前 key 仍包含 `requestId`，且没有 cooldown

**Step 3: Write minimal implementation**
- 在 `request-auth-feedback.ts` 中调整 key 规则
- 增加 auth feedback cooldown 记录

**Step 4: Run test to verify it passes**
Run: `pnpm exec vitest run src/modules/shared/infrastructure/__tests__/request-auth-feedback.spec.ts`
Expected: PASS

### Task 2: 更新文档说明

**Files:**
- Modify: `docs/request-auth-refresh-architecture.md`

**Step 1: Update docs**
- 说明 `401/403` feedback 现已采用 cause-level dedupe
- 说明 auth feedback 具备 cooldown

**Step 2: Verify docs and relevant tests**
Run: `pnpm exec vitest run src/modules/shared/infrastructure/__tests__/request-auth-feedback.spec.ts src/modules/shared/infrastructure/__tests__/useRequest.behavior.spec.ts && pnpm type-check`
Expected: PASS
