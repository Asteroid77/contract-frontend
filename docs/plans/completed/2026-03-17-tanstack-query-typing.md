Status: completed
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# TanStack Query 类型统一改造 Implementation Plan

**Goal:** 将仓库中的 TanStack Query 全局扩展和 hooks 类型写法统一到 v5 当前最佳实践：基础设施层收敛边界类型，hooks 层推导优先，并在每一步保持测试、类型检查和文档同步通过。

**Architecture:** 先收敛全局 `Register`、`queryKey`、`meta` 和 `useRequestPlugin` 的边界类型，再按模块批量迁移显式 `useQuery<...>` / `useMutation<...>` 写法。整个过程保持运行时行为不变，验证以相关单测和 `pnpm type-check` 为主。

**Tech Stack:** TypeScript、Vue 3、@tanstack/vue-query v5、Vitest、Axios、Naive UI。

> **Note:** 根据仓库规则，本计划省略 git commit / branch 步骤；只包含代码、测试、类型检查和文档更新步骤。
>
> **Progress (2026-03-17):** 阶段 1 已完成并通过 `pnpm type-check` 与相关回归测试；Task 3（阶段 2 第一批 query-first hooks：`agent-aggregate` / `file` / `captcha` / `invitation`）已完成并通过 `pnpm type-check` 与相关 hooks 回归测试；Task 4（阶段 2 第二批 mixed query hooks：`approval` / `service-agreement` / `user-query` / `access-query`）已完成并通过 `pnpm type-check` 与相关 hooks 回归测试；Task 5（阶段 3 第一批 user mutation hooks：`change-password` / `login` / `totp` / `additional-info-request`）已完成并通过 `pnpm type-check` 与相关 hooks 回归测试；Task 6（阶段 3 第二批 work-order mutation-heavy hooks）已完成并通过 `pnpm type-check` 与新增 hooks 回归测试；Task 7（收尾扫描、文档同步与最终验证）已完成，`rg -n "useQuery<|useMutation<" src/modules` 无匹配，最终 `pnpm type-check` 与计划内 hooks 回归集通过。

---

### Task 1: 为全局 TanStack Query 类型增加回归契约

**Files:**
- Create: `src/types/vendor/vue-query.contract.ts`
- Modify: `src/app/plugins/__tests__/useRequestPlugin.spec.ts`

**Step 1: Write the failing test**

创建一个最小类型契约文件，验证未来目标：

```ts
import type { QueryKey } from '@tanstack/vue-query'

type ExpectAppKey = QueryKey

declare const meta: NonNullable<import('@tanstack/vue-query').QueryMeta>

meta.skipGlobalErrorHandler satisfies boolean | undefined
meta.toastOnError
meta.toastOnSuccess
```

同时在 `useRequestPlugin.spec.ts` 中补充/收紧测试桩类型，去掉对 `string` 型 `toastOnError` / `toastOnSuccess` 的隐式容忍。

**Step 2: Run test to verify it fails**
- Run: `pnpm type-check`
- Expected: FAIL，原因是当前 `vue-query.d.ts` 仍采用旧的泛型 Meta 扩展，且类型与计划中的 `Register` 形态不一致。

**Step 3: Write minimal implementation**
- 先不要动业务 hooks。
- 仅准备让全局类型有可验证的目标形态。

**Step 4: Run test to verify the red case is reproducible**
- Run: `pnpm type-check`
- Expected: 继续 FAIL，且失败原因指向全局类型定义差异，而不是无关文件。

---

### Task 2: 用 `Register` 重写全局 Vue Query 扩展并清理插件边界类型

**Files:**
- Modify: `src/types/vendor/vue-query.d.ts`
- Modify: `src/app/plugins/useRequestPlugin.ts`
- Modify: `src/app/plugins/__tests__/useRequestPlugin.spec.ts`
- Reuse: `src/types/vendor/vue-query.contract.ts`

**Step 1: Write the failing test**
- 让 `useRequestPlugin.spec.ts` 先覆盖并明确以下契约：
  - `skipGlobalErrorHandler` 仍可跳过全局错误处理
  - `toastOnSuccess` / `toastOnError` 仍支持 `boolean`、通知配置对象和函数回调
  - 不再依赖运行时未实现的 `string` 分支

**Step 2: Run test to verify it fails**
- Run: `pnpm test:unit -- src/app/plugins/__tests__/useRequestPlugin.spec.ts`
- Expected: FAIL（如果测试仍假定旧类型或旧桩结构）。

**Step 3: Write minimal implementation**
- 在 `src/types/vendor/vue-query.d.ts` 中：
  - 定义 `AppQueryKey`
  - 定义 `AppQueryMeta` / `AppMutationMeta`
  - 使用 `declare module '@tanstack/vue-query' { interface Register { ... } }`
- 在 `src/app/plugins/useRequestPlugin.ts` 中：
  - 提取 `AppQuery`、`AppMutation`、`RequestTarget` 等边界类型别名
  - 清理重复 `unknown` 泛型
  - 让 `meta` 访问与新全局类型对齐
- 在测试中同步收敛 stub 类型

**Step 4: Run tests to verify they pass**
- Run: `pnpm test:unit -- src/app/plugins/__tests__/useRequestPlugin.spec.ts`
- Expected: PASS。

**Step 5: Run type verification**
- Run: `pnpm type-check`
- Expected: PASS，至少基础设施层和类型契约文件通过。

---

### Task 3: 迁移 query-first 模块（agent-aggregate / file / captcha / invitation）

**Files:**
- Modify: `src/modules/agent-aggregate/application/hooks/useAgentAggregateService.ts`
- Modify: `src/modules/file/application/hooks/useFileService.ts`
- Modify: `src/modules/captcha/application/hooks/useCaptcha.ts`
- Modify: `src/modules/captcha/application/hooks/useSMS.ts`
- Modify: `src/modules/invitation/application/hooks/useInvitationService.ts`
- Test: `src/modules/file/application/hooks/__tests__/useFileService.spec.ts`
- Test: `src/modules/captcha/application/hooks/__tests__/useCaptcha.spec.ts`
- Test: `src/modules/captcha/application/hooks/__tests__/useSMS.spec.ts`
- Test: `src/modules/invitation/application/hooks/__tests__/useInvitationService.spec.ts`

**Step 1: Write the failing test**
- 补充或调整现有 hooks 单测，确保它们断言的是：
  - query key 不变
  - enabled / retry / staleTime 等行为不变
  - mutation 输入输出行为不变
- 对 `agent-aggregate` 若无专门 hooks 单测，先以 `pnpm type-check` 作为 red case，并在必要时补最小 hooks 测试文件。

**Step 2: Run tests to verify they fail where expected**
- Run: `pnpm test:unit -- src/modules/file/application/hooks/__tests__/useFileService.spec.ts src/modules/captcha/application/hooks/__tests__/useCaptcha.spec.ts src/modules/captcha/application/hooks/__tests__/useSMS.spec.ts src/modules/invitation/application/hooks/__tests__/useInvitationService.spec.ts`
- Run: `pnpm type-check`
- Expected: 至少一个校验在迁移前因类型或测试桩不匹配而失败，形成 red case。

**Step 3: Write minimal implementation**
- 移除不必要的 `useQuery<...>` / `useMutation<...>` 显式泛型
- 让 `queryFn` / `mutationFn` 返回值驱动推导
- 仅在 `select` 或变量推导不足时保留最小显式类型

**Step 4: Run tests to verify they pass**
- Run: `pnpm test:unit -- src/modules/file/application/hooks/__tests__/useFileService.spec.ts src/modules/captcha/application/hooks/__tests__/useCaptcha.spec.ts src/modules/captcha/application/hooks/__tests__/useSMS.spec.ts src/modules/invitation/application/hooks/__tests__/useInvitationService.spec.ts`
- Run: `pnpm type-check`
- Expected: PASS。

---

### Task 4: 迁移 mixed query 模块（approval / service-agreement / user-query / access-query）

**Files:**
- Modify: `src/modules/approval/application/hooks/useApprovalService.ts`
- Modify: `src/modules/service-agreement/application/hooks/useSignService.ts`
- Modify: `src/modules/user/application/hooks/useLoadUserInfo.ts`
- Modify: `src/modules/user/application/hooks/useUserDevices.ts`
- Modify: `src/modules/user/application/hooks/useUserPage.ts`
- Modify: `src/modules/access/application/hooks/useRoleService.ts`
- Test: `src/modules/approval/application/hooks/__tests__/useApprovalService.spec.ts`
- Test: `src/modules/service-agreement/application/hooks/__tests__/useSignService.spec.ts`
- Test: `src/modules/user/application/hooks/__tests__/query-hooks.spec.ts`
- Test: `src/modules/user/application/hooks/__tests__/useUserDevices.spec.ts`
- Test: `src/modules/access/application/hooks/__tests__/useRoleService.spec.ts`

**Step 1: Write the failing test**
- 先调整现有 hooks 测试，让它们关注缓存 key、mutation/query 调用参数、无业务行为回归。
- 对 `useSignService.ts` 中 `meta.toastOnError/toastOnSuccess` 的场景，确保仍与全局插件契约一致。

**Step 2: Run tests to verify it fails**
- Run: `pnpm test:unit -- src/modules/approval/application/hooks/__tests__/useApprovalService.spec.ts src/modules/service-agreement/application/hooks/__tests__/useSignService.spec.ts src/modules/user/application/hooks/__tests__/query-hooks.spec.ts src/modules/user/application/hooks/__tests__/useUserDevices.spec.ts src/modules/access/application/hooks/__tests__/useRoleService.spec.ts`
- Run: `pnpm type-check`
- Expected: FAIL，原因应与旧显式泛型或测试桩类型不一致有关。

**Step 3: Write minimal implementation**
- 迁移 query-heavy hooks 到“推导优先”写法
- 保持 `withQueryRequestContext(...)`、`invalidateQueries(...)`、`setQueryData(...)` 行为不变
- 对仍需要显式变量类型的 mutation 保留最小注解

**Step 4: Run tests to verify they pass**
- Run: `pnpm test:unit -- src/modules/approval/application/hooks/__tests__/useApprovalService.spec.ts src/modules/service-agreement/application/hooks/__tests__/useSignService.spec.ts src/modules/user/application/hooks/__tests__/query-hooks.spec.ts src/modules/user/application/hooks/__tests__/useUserDevices.spec.ts src/modules/access/application/hooks/__tests__/useRoleService.spec.ts`
- Run: `pnpm type-check`
- Expected: PASS。

---

### Task 5: 迁移 user mutation 模块

**Files:**
- Modify: `src/modules/user/application/hooks/useChangePassword.ts`
- Modify: `src/modules/user/application/hooks/useLogin.ts`
- Modify: `src/modules/user/application/hooks/useTotpManagement.ts`
- Modify: `src/modules/user/application/hooks/useTotpVerify.ts`
- Modify: `src/modules/user/application/hooks/useUserAdditionalInfoRequest.ts`
- Test: `src/modules/user/application/hooks/__tests__/auth-hooks.spec.ts`
- Test: `src/modules/user/application/hooks/__tests__/query-hooks.spec.ts`
- Test: `src/modules/user/application/hooks/__tests__/useUserDevices.spec.ts`

**Step 1: Write the failing test**
- 让现有用户 hooks 测试先覆盖 mutation 入参与成功/失败回调行为。
- 对 `useTotpManagement.ts` 中多个 mutation/query 共存场景，先确认测试桩不会依赖旧显式泛型。

**Step 2: Run tests to verify it fails**
- Run: `pnpm test:unit -- src/modules/user/application/hooks/__tests__/auth-hooks.spec.ts src/modules/user/application/hooks/__tests__/query-hooks.spec.ts src/modules/user/application/hooks/__tests__/useUserDevices.spec.ts`
- Run: `pnpm type-check`
- Expected: FAIL（若旧写法与新全局类型约束冲突）。

**Step 3: Write minimal implementation**
- 让 `mutationFn` 返回值驱动 `data` 推导
- 只保留确有必要的变量类型注解
- 不改变 hook 的导出 API 和业务回调逻辑

**Step 4: Run tests to verify they pass**
- Run: `pnpm test:unit -- src/modules/user/application/hooks/__tests__/auth-hooks.spec.ts src/modules/user/application/hooks/__tests__/query-hooks.spec.ts src/modules/user/application/hooks/__tests__/useUserDevices.spec.ts`
- Run: `pnpm type-check`
- Expected: PASS。

---

### Task 6: 迁移 work-order mutation-heavy 模块

> **Status (2026-03-17):** 已完成。已新增 `src/modules/work-order/application/hooks/__tests__/useCategoryService.spec.ts` 与 `src/modules/work-order/application/hooks/__tests__/useWorkOrderService.spec.ts` 最小回归测试；迁移后 `pnpm type-check` ✅，相关单测命令 ✅。由于仓库 `test:unit` 脚本会实际执行整套 Vitest，本次结果为 `208/208` 文件、`836/836` 用例通过。

**Files:**
- Modify: `src/modules/work-order/application/hooks/useCategoryService.ts`
- Modify: `src/modules/work-order/application/hooks/useWorkOrderService.ts`
- Test or Create: `src/modules/work-order/application/hooks/__tests__/useCategoryService.spec.ts`
- Test or Create: `src/modules/work-order/application/hooks/__tests__/useWorkOrderService.spec.ts`

**Step 1: Write the failing test**
- 如果当前无 hooks 单测，先补两个最小 hooks 测试文件：
  - 断言 query key 与 mutationFn 调用参数不变
  - 断言 `invalidateQueries` / `setQueryData` / 成功回调行为不变

示例骨架：

```ts
it('passes dto to create mutation and invalidates expected keys', async () => {
  // arrange useMutation / useQueryClient mocks
  // call hook
  // trigger mutate callback
  // assert keys and arguments
})
```

**Step 2: Run tests to verify it fails**
- Run: `pnpm test:unit -- src/modules/work-order/application/hooks/__tests__/useCategoryService.spec.ts src/modules/work-order/application/hooks/__tests__/useWorkOrderService.spec.ts`
- Expected: FAIL，因为测试文件刚建立且当前实现尚未按预期桩结构覆盖，或需要补齐 mock。

**Step 3: Write minimal implementation**
- 迁移 `useMutation<...>` / `useQuery<...>` 到推导优先写法
- 对复杂变量对象仅保留必要入参类型
- 保持缓存失效与更新逻辑不变

**Step 4: Run tests to verify they pass**
- Run: `pnpm test:unit -- src/modules/work-order/application/hooks/__tests__/useCategoryService.spec.ts src/modules/work-order/application/hooks/__tests__/useWorkOrderService.spec.ts`
- Run: `pnpm type-check`
- Expected: PASS。

---

### Task 7: 收尾清理、文档同步与全仓验证

> **Status (2026-03-17):** 已完成。`rg -n "useQuery<|useMutation<" src/modules` 当前无匹配；最终 `pnpm type-check` ✅；计划内 hooks 回归集命令 ✅，结果为 `208/208` 文件、`836/836` 用例通过。

**Files:**
- Modify: `docs/plans/2026-03-17-tanstack-query-typing-design.md`
- Modify: `docs/plans/2026-03-17-tanstack-query-typing.md`
- Sweep: `src/modules/**/application/hooks/*`

**Step 1: Write the failing test**
- 用仓库扫描结果作为收尾检查：

```bash
rg -n "useQuery<|useMutation<" src/modules
```

将输出结果与目标对照，确认是否还有不必要的显式泛型残留。

**Step 2: Run verification to identify remaining gaps**
- Run: `rg -n "useQuery<|useMutation<" src/modules`
- Run: `pnpm type-check`
- Expected: 若仍有残留，列出并逐一确认是否属于“必要显式类型”。

**Step 3: Write minimal implementation**
- 清理无必要的残留泛型
- 更新设计文档中的“已落地状态”与“后续新增 hooks 约束”

**Step 4: Run final verification**
- Run: `pnpm type-check`
- Run: `pnpm test:unit -- src/app/plugins/__tests__/useRequestPlugin.spec.ts src/modules/file/application/hooks/__tests__/useFileService.spec.ts src/modules/captcha/application/hooks/__tests__/useCaptcha.spec.ts src/modules/captcha/application/hooks/__tests__/useSMS.spec.ts src/modules/invitation/application/hooks/__tests__/useInvitationService.spec.ts src/modules/approval/application/hooks/__tests__/useApprovalService.spec.ts src/modules/service-agreement/application/hooks/__tests__/useSignService.spec.ts src/modules/user/application/hooks/__tests__/auth-hooks.spec.ts src/modules/user/application/hooks/__tests__/query-hooks.spec.ts src/modules/user/application/hooks/__tests__/useUserDevices.spec.ts src/modules/access/application/hooks/__tests__/useRoleService.spec.ts src/modules/work-order/application/hooks/__tests__/useCategoryService.spec.ts src/modules/work-order/application/hooks/__tests__/useWorkOrderService.spec.ts`
- Expected: 类型检查通过；已覆盖 hooks 的单测通过；扫描结果只剩下“必要的显式泛型”。

---

## 参考信源
- https://tanstack.com/query/latest/docs/framework/vue/typescript
- https://tanstack.com/query/latest/docs/framework/react/guides/query-options
- https://github.com/TanStack/query/blob/v5.71.10/docs/framework/react/typescript.md
- https://github.com/lukemorales/query-key-factory
