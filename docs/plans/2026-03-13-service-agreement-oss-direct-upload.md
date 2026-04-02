# Service Agreement OSS Direct Upload Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 `service-agreement` 附件上传从业务后端 `multipart` 改为与 `work-order` 一致的 OSS 表单直传，同时保持表单仅存储文件 `id[]`。

**Architecture:** 在 `service-agreement` 仓储层内部封装 OSS 直传流程：先请求 `/file/policy`，再直传 `policy.host`，最终返回 `OssCallbackDTO`。应用层与展示层保持原接口，继续消费 `OssCallbackView`。

**Tech Stack:** TypeScript、Vue 3、Vue Query、Axios、Vitest、Naive UI。

---

### Task 1: 调整仓储层测试到 OSS 直传契约

**Files:**
- Modify: `src/modules/service-agreement/infrastructure/__tests__/service-agreement-repository.spec.ts`

**Step 1: Write the failing test**
- 将现有上传测试改为断言：先请求 `/file/policy`，再向 `policy.host` 提交 `FormData`，并包含 `callback` 字段。

**Step 2: Run test to verify it fails**
- Run: `pnpm test:unit -- src/modules/service-agreement/infrastructure/__tests__/service-agreement-repository.spec.ts`
- Expected: FAIL，因为当前实现仍调用 `/service_agreement/upload`。

**Step 3: Write minimal implementation**
- 在仓储层实现 policy 获取与 OSS 直传。

**Step 4: Run test to verify it passes**
- Run: `pnpm test:unit -- src/modules/service-agreement/infrastructure/__tests__/service-agreement-repository.spec.ts`
- Expected: PASS。

### Task 2: 保持应用层上传契约稳定

**Files:**
- Modify: `src/modules/service-agreement/application/__tests__/service.spec.ts`
- Modify: `src/modules/service-agreement/application/service.ts`

**Step 1: Write the failing test**
- 如有必要，补充/调整 `uploadFile` 用例，确保 service 仍将 DTO 映射为 `OssCallbackView`。

**Step 2: Run test to verify it fails**
- Run: `pnpm test:unit -- src/modules/service-agreement/application/__tests__/service.spec.ts`

**Step 3: Write minimal implementation**
- 仅在必要时调整 service 类型，使其适配仓储新上传流程。

**Step 4: Run test to verify it passes**
- Run: `pnpm test:unit -- src/modules/service-agreement/application/__tests__/service.spec.ts`
- Expected: PASS。

### Task 3: 补充 TODO 并回归验证

**Files:**
- Modify: `src/modules/service-agreement/infrastructure/service-agreement-repository.ts`

**Step 1: Write the failing test**
- 无新增行为测试，保留最小注释性 TODO。

**Step 2: Run focused tests**
- Run: `pnpm test:unit -- src/modules/service-agreement/infrastructure/__tests__/service-agreement-repository.spec.ts src/modules/service-agreement/application/__tests__/service.spec.ts`

**Step 3: Run broader verification**
- Run: `pnpm test:unit`
- Expected: 与仓库当前基线一致，至少改动相关用例全部通过。
