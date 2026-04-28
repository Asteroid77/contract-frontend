Status: completed
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# TanStack Query 类型统一改造设计

**日期**: 2026-03-17  
**适用范围**: `src/types/vendor/vue-query.d.ts`、`src/app/plugins/useRequestPlugin.ts`、`src/modules/**/application/hooks/*`  
**当前仓库版本基线**: `@tanstack/vue-query@5.90.5`、`typescript@5.8.3`

## 背景

当前仓库已经对 TanStack Query 做了两类定制：

1. 在 `src/types/vendor/vue-query.d.ts` 中扩展了 `QueryMeta` / `MutationMeta`
2. 在各模块 hooks 中大量显式书写 `useQuery<...>` / `useMutation<...>` 泛型

这套写法能工作，但出现了三个工程问题：

- **基础设施层泛型噪音大**：`useRequestPlugin.ts` 中出现大量 `Query<unknown, unknown, unknown>` / `Mutation<unknown, unknown, unknown, unknown>`，阅读和维护成本高。
- **全局类型与运行时实现不一致**：当前类型允许 `toastOnError` / `toastOnSuccess` 为 `string`，但运行时实现并没有把字符串作为独立分支处理。
- **业务 hooks 显式泛型过多**：许多 query / mutation 的返回值本可以由 `queryFn` / `mutationFn` 自动推导，却仍然手写了完整泛型，导致样板代码增多，也让全局错误类型、key 类型和 meta 类型更难统一。

## 目标

- 将 TanStack Query 全局扩展切换到 v5 官方推荐的 `Register` 方式。
- 统一 `queryMeta`、`mutationMeta`、`queryKey`、`mutationKey` 的项目级约束。
- 收敛 `useRequestPlugin.ts` 的边界类型，消除重复 `unknown` 泛型噪音。
- 分阶段减少 hooks 层显式 `useQuery<...>` / `useMutation<...>` 泛型，回归“推导优先”。
- 输出一份带信源的最佳实践文档，作为后续新增 hooks 的项目内约定。

## 非目标

- 不修改 service、repository、domain model、API 协议。
- 不改变 query key 的业务语义，只统一其类型边界。
- 不为了“零显式泛型”而引入过度抽象。
- 不在本次规划中执行 git commit / branch 操作（遵循仓库规则）。

## 当前实施状态

### 2026-03-17：阶段 1 已完成

- 已将 `src/types/vendor/vue-query.d.ts` 切换为 TanStack Query v5 推荐的 `Register` 扩展方式。
- 已将 `queryKey` / `mutationKey` 统一为“首元素为 string”的结构化 key 类型。
- 已移除 `meta.toastOnError` / `meta.toastOnSuccess` 中运行时未实现的 `string` 分支。
- 已收敛 `src/app/plugins/useRequestPlugin.ts` 的 Query / Mutation 边界类型，并保持运行时行为不变。
- 已对受结构化 key 影响的最小范围文件做兼容修正：
  - `src/modules/approval/application/hooks/useApprovalService.ts`
  - `src/modules/file/application/hooks/useFileService.ts`
  - `src/modules/user/application/hooks/useLoadUserInfo.ts`
  - `src/modules/user/application/hooks/useUserAdditionalInfoRequest.ts`
  - `src/app/infrastructure/query/__tests__/query-request-context.spec.ts`
  - `src/modules/captcha/application/hooks/__tests__/useCaptcha.spec.ts`
  - `src/modules/user/application/hooks/__tests__/useUserDevices.spec.ts`
- 验证结果：
  - `pnpm type-check` ✅
  - `pnpm test:unit -- src/app/plugins/__tests__/useRequestPlugin.spec.ts src/app/infrastructure/query/__tests__/query-request-context.spec.ts src/modules/captcha/application/hooks/__tests__/useCaptcha.spec.ts src/modules/user/application/hooks/__tests__/useUserDevices.spec.ts` ✅

### 2026-03-17：阶段 2 第一批（Task 3 / query-first hooks）已完成

- 已将以下 hooks 迁移为“推导优先”写法，移除不必要的 `useQuery<...>` / `useMutation<...>` 显式泛型：
  - `src/modules/agent-aggregate/application/hooks/useAgentAggregateService.ts`
  - `src/modules/file/application/hooks/useFileService.ts`
  - `src/modules/captcha/application/hooks/useCaptcha.ts`
  - `src/modules/captcha/application/hooks/useSMS.ts`
  - `src/modules/invitation/application/hooks/useInvitationService.ts`
- 迁移过程中保持以下运行时行为不变：
  - query key / mutation key 结构不变
  - `enabled` / `retry` / `staleTime` / `placeholderData` 等配置不变
  - `setQueryData(...)` / `invalidateQueries(...)` 等缓存行为不变
- 验证结果：
  - `pnpm type-check` ✅
  - `pnpm test:unit -- src/modules/file/application/hooks/__tests__/useFileService.spec.ts src/modules/captcha/application/hooks/__tests__/useCaptcha.spec.ts src/modules/captcha/application/hooks/__tests__/useSMS.spec.ts src/modules/invitation/application/hooks/__tests__/useInvitationService.spec.ts` ✅
    - 当前仓库脚本会实际执行整套 Vitest，结果为 `206/206` 文件、`820/820` 用例通过

### 2026-03-17：阶段 2 第二批（Task 4 / mixed query hooks）已完成

- 已将以下 hooks 迁移为“推导优先”写法，移除不必要的 `useQuery<...>` / `useMutation<...>` 显式泛型：
  - `src/modules/approval/application/hooks/useApprovalService.ts`
  - `src/modules/service-agreement/application/hooks/useSignService.ts`
  - `src/modules/user/application/hooks/useLoadUserInfo.ts`
  - `src/modules/user/application/hooks/useUserDevices.ts`
  - `src/modules/user/application/hooks/useUserPage.ts`
  - `src/modules/access/application/hooks/useRoleService.ts`
- 针对接收 `Ref` 参数的 query hooks，本批额外修复了 query key / enabled 的响应式问题：
  - `useApprovalInstanceDetail(...)`
  - `useApprovalHistoryQuery(...)`
  - `usePreviewAttachments(...)`
- 迁移过程中保持以下运行时行为不变：
  - query key / mutation key 业务语义不变
  - `placeholderData` / `staleTime` / `gcTime` / `refetchOnWindowFocus` 等配置不变
  - `invalidateQueries(...)` / `setQueryData(...)` 等缓存行为不变
  - `meta.toastOnError` / `meta.toastOnSuccess` 与全局插件契约保持一致
- 对于 `useRevokeCurrentUserDevicesMutation(...)`，保留了最小变量类型注解，避免 `TVariables` 退化为 `void`
- 验证结果：
  - `pnpm type-check` ✅
  - `pnpm test:unit -- src/modules/approval/application/hooks/__tests__/useApprovalService.spec.ts src/modules/service-agreement/application/hooks/__tests__/useSignService.spec.ts src/modules/user/application/hooks/__tests__/query-hooks.spec.ts src/modules/user/application/hooks/__tests__/useUserDevices.spec.ts src/modules/access/application/hooks/__tests__/useRoleService.spec.ts` ✅
    - 当前仓库脚本会实际执行整套 Vitest，结果为 `206/206` 文件、`823/823` 用例通过

### 2026-03-17：阶段 3 第一批（Task 5 / user mutation hooks）已完成

- 已将以下 hooks 迁移为“推导优先”写法，移除不必要的 `useMutation<...>` / `useQuery<...>` 显式泛型：
  - `src/modules/user/application/hooks/useChangePassword.ts`
  - `src/modules/user/application/hooks/useLogin.ts`
  - `src/modules/user/application/hooks/useTotpManagement.ts`
  - `src/modules/user/application/hooks/useTotpVerify.ts`
  - `src/modules/user/application/hooks/useUserAdditionalInfoRequest.ts`
- 对于变量推导确实需要的场景，仅保留了最小入参类型注解：
  - `ChangePasswordForm`
  - `SignInMutate`
  - `TotpEnableForm`
  - `TotpDisableForm`
  - `TotpVerifyMutate`
  - `UserAdditionalInfoForm`
- 本批补充了 TOTP hooks 的最小回归测试，覆盖：
  - `useTotpStatusQuery(...)` 的 query key 与 queryFn 委托
  - `useTotpSetupMutation(...)` / `useTotpBackupCodesMutation(...)` 的 mutationFn 行为
  - `useTotpEnableMutation(...)` / `useTotpDisableMutation(...)` 的缓存失效行为
  - `useTotpVerify(...)` 的变量映射、登录与跳转行为
- 迁移过程中保持以下运行时行为不变：
  - 登录与二次验证流程不变
  - `additional_info` mutation key 不变
  - `invalidateQueries(...)` 行为不变
- 验证结果：
  - `pnpm type-check` ✅
  - `pnpm test:unit -- src/modules/user/application/hooks/__tests__/auth-hooks.spec.ts src/modules/user/application/hooks/__tests__/query-hooks.spec.ts src/modules/user/application/hooks/__tests__/useUserDevices.spec.ts` ✅
    - 当前仓库脚本会实际执行整套 Vitest，结果为 `206/206` 文件、`827/827` 用例通过

### 2026-03-17：阶段 3 第二批（Task 6 / work-order mutation-heavy hooks）已完成

- 已将以下 hooks 迁移为“推导优先”写法，移除不必要的 `useQuery<...>` / `useMutation<...>` 显式泛型：
  - `src/modules/work-order/application/hooks/useCategoryService.ts`
  - `src/modules/work-order/application/hooks/useWorkOrderService.ts`
- 对变量推导确实需要的 mutation，仅保留最小入参类型注解，不再在 hooks 调用点堆叠完整泛型。
- 本批新增了最小 hooks 回归测试，覆盖：
  - `useCategoryService` 的 query key、mutation 参数透传与缓存失效行为
  - `useWorkOrderService` 的 query key、`setQueryData(...)` / `invalidateQueries(...)` 与成功回调行为
- 迁移过程中保持以下运行时行为不变：
  - `withQueryRequestContext(...)` 委托不变
  - `invalidateQueries(...)` / `setQueryData(...)` 逻辑不变
  - 业务回调与 DTO 映射不变
- 验证结果：
  - `pnpm type-check` ✅
  - `pnpm test:unit -- src/modules/work-order/application/hooks/__tests__/useCategoryService.spec.ts src/modules/work-order/application/hooks/__tests__/useWorkOrderService.spec.ts` ✅
    - 当前仓库脚本会实际执行整套 Vitest，结果为 `208/208` 文件、`836/836` 用例通过

### 2026-03-17：阶段 4（Task 7 / 收尾清理与规范固化）已完成

- 已完成最终残留扫描：
  - `rg -n "useQuery<|useMutation<" src/modules`
  - 结果：无匹配，`src/modules/**/application/hooks/*` 中已无显式 `useQuery<...>` / `useMutation<...>` 残留
- 已完成最终验证：
  - `pnpm type-check` ✅
  - `pnpm test:unit -- src/app/plugins/__tests__/useRequestPlugin.spec.ts src/modules/file/application/hooks/__tests__/useFileService.spec.ts src/modules/captcha/application/hooks/__tests__/useCaptcha.spec.ts src/modules/captcha/application/hooks/__tests__/useSMS.spec.ts src/modules/invitation/application/hooks/__tests__/useInvitationService.spec.ts src/modules/approval/application/hooks/__tests__/useApprovalService.spec.ts src/modules/service-agreement/application/hooks/__tests__/useSignService.spec.ts src/modules/user/application/hooks/__tests__/auth-hooks.spec.ts src/modules/user/application/hooks/__tests__/query-hooks.spec.ts src/modules/user/application/hooks/__tests__/useUserDevices.spec.ts src/modules/access/application/hooks/__tests__/useRoleService.spec.ts src/modules/work-order/application/hooks/__tests__/useCategoryService.spec.ts src/modules/work-order/application/hooks/__tests__/useWorkOrderService.spec.ts` ✅
    - 当前仓库脚本会实际执行整套 Vitest，结果为 `208/208` 文件、`836/836` 用例通过
- 已同步更新本设计文档与实施计划文档，作为后续新增 hooks 的项目内约定基线

## 当前最佳实践判断

### 1. 基础设施层：接受边界类型，不追求伪精确泛型

`QueryCache` / `MutationCache` 回调天然跨业务域。此类代码不知道每个 query / mutation 的真实 `data`、`variables`、`context`，因此允许一定程度的边界类型是合理的。最佳实践不是强行把所有 `unknown` 变成业务类型，而是：

- 用项目级别别名收敛通用类型
- 强类型化 `meta`、`key`、公共回调协议
- 将真实业务数据类型留给具体 hooks 的 `queryFn` / `mutationFn` 去推导

### 2. 全局扩展：优先 `Register`，而不是继续堆叠泛型 `QueryMeta` / `MutationMeta`

TanStack Query v5 官方推荐通过模块扩展 `Register` 统一声明：

- `queryMeta`
- `mutationMeta`
- `queryKey`
- `mutationKey`
- `defaultError`（可选）

这比直接扩展 `QueryMeta<T...>` / `MutationMeta<T...>` 更稳定，也更接近 v5 文档风格。

### 3. hooks 层：推导优先，必要时才显式标注

当前仓库里有 18 个 hooks 文件显式使用了 `useQuery<...>` / `useMutation<...>`。社区和官方当前更推荐：

- 让 `queryFn` / `mutationFn` 返回值驱动推导
- 少写完整四段泛型
- 抽离复用配置时使用 `queryOptions` / `mutationOptions`
- 只在以下情况保留显式类型：
  - `select` 改变了最终 `data` 形状
  - `variables` 仅通过调用点无法稳定推导
  - 第三方返回值本身声明过弱，需要局部补充

### 4. 错误类型：不建议全局锁死为 `AxiosError`

当前基础设施同时处理：

- `BusinessError`
- `AxiosError`
- 普通 `Error`
- 非 `Error` 值

因此全局将 `defaultError` 锁死为 `AxiosError` 并不适合当前仓库。更稳妥的做法是：

- 保持默认 `Error` 基线，或不额外注册 `defaultError`
- 在需要时局部使用 `axios.isAxiosError(...)`
- 对业务异常继续使用 `instanceof BusinessError`

这能避免在所有 hooks 调用点产生“看似统一，实际失真”的错误类型。

### 5. 社区实践：key factory 是可选增强，不是第一阶段必需品

像 `@lukemorales/query-key-factory` 这样的库反映了社区对“结构化 query key”的偏好，但对当前仓库而言，第一阶段更重要的是：

- 先把全局 `queryKey` / `mutationKey` 类型统一起来
- 先让现有 `keys` 常量和 hooks 写法稳定
- 再根据复用压力决定是否引入专门的 key factory 库

因此本次只把它作为可选参考，不作为强制改造项。

## 项目内落地决策

### 决策 A：将 `src/types/vendor/vue-query.d.ts` 调整为 `Register` 扩展

目标结构：

- `type AppQueryKey = readonly [string, ...unknown[]]`
- `interface AppQueryMeta extends Record<string, unknown>`
- `interface AppMutationMeta extends Record<string, unknown>`
- 在 `declare module '@tanstack/vue-query' { interface Register { ... } }` 中统一注册

其中 `meta` 只声明当前运行时真正支持的字段：

- `skipGlobalErrorHandler?: boolean`
- `toastOnError?: boolean | NaiveNotificationOptions | 回调函数`
- `toastOnSuccess?: boolean | NaiveNotificationOptions | 回调函数`

不再保留运行时未特殊处理的 `string` 分支。

### 决策 B：在 `useRequestPlugin.ts` 引入项目边界类型别名

示例方向：

- `type AppQuery = Query<unknown, Error, unknown, AppQueryKey>`
- `type AppMutation = Mutation<unknown, Error, unknown, unknown>`
- `type RequestTarget = AppQuery | AppMutation`

目标不是让这个文件拿到精确业务类型，而是：

- 减少噪音
- 强化可读性
- 让 `meta` / `key` / `state` 的访问更稳定

### 决策 C：按模块分阶段迁移 hooks，优先 query 后 mutation

分四阶段推进：

1. **阶段 1：基础设施统一**
   - `src/types/vendor/vue-query.d.ts`
   - `src/app/plugins/useRequestPlugin.ts`
   - `src/app/plugins/__tests__/useRequestPlugin.spec.ts`
   - 新增最小类型契约文件（通过 `pnpm type-check` 验证）

2. **阶段 2：query 为主的 hooks**
   - `agent-aggregate`
   - `file`
   - `captcha`
   - `invitation`
   - `approval`
   - `service-agreement`
   - `user` 中 query-heavy hooks

3. **阶段 3：mutation 为主的 hooks**
   - `access`
   - `user`
   - `work-order`
   - `approval`
   - `service-agreement`

4. **阶段 4：收尾与规范固化**
   - 清理残留显式泛型
   - 补全最佳实践文档
   - 形成新增 hooks 的团队约定

### 决策 D：验证以“类型 + 相关单测”为主，不扩散到业务逻辑变更

每个阶段都采用同一完成标准：

- 先补类型契约或相关测试，确认当前写法无法满足目标
- 再做最小实现修改
- 跑改动相关单测
- 跑 `pnpm type-check`
- 同步更新文档

因为本次变更集中在 hooks 层与公共类型层，主要风险是类型回归与测试桩兼容性，而不是业务逻辑风险。

## 受影响文件清单（迁移范围）

> **Final scan (2026-03-17):** `rg -n "useQuery<|useMutation<" src/modules` 已无匹配。以下清单记录的是本次迁移覆盖范围，而不是当前残留列表。

### 基础设施
- `src/types/vendor/vue-query.d.ts`
- `src/app/plugins/useRequestPlugin.ts`
- `src/app/plugins/__tests__/useRequestPlugin.spec.ts`

### 显式 `useQuery<...>` / `useMutation<...>` hooks
- `src/modules/access/application/hooks/useRoleService.ts`
- `src/modules/agent-aggregate/application/hooks/useAgentAggregateService.ts`
- `src/modules/approval/application/hooks/useApprovalService.ts`
- `src/modules/captcha/application/hooks/useCaptcha.ts`
- `src/modules/captcha/application/hooks/useSMS.ts`
- `src/modules/file/application/hooks/useFileService.ts`
- `src/modules/invitation/application/hooks/useInvitationService.ts`
- `src/modules/service-agreement/application/hooks/useSignService.ts`
- `src/modules/user/application/hooks/useChangePassword.ts`
- `src/modules/user/application/hooks/useLoadUserInfo.ts`
- `src/modules/user/application/hooks/useLogin.ts`
- `src/modules/user/application/hooks/useTotpManagement.ts`
- `src/modules/user/application/hooks/useTotpVerify.ts`
- `src/modules/user/application/hooks/useUserAdditionalInfoRequest.ts`
- `src/modules/user/application/hooks/useUserDevices.ts`
- `src/modules/user/application/hooks/useUserPage.ts`
- `src/modules/work-order/application/hooks/useCategoryService.ts`
- `src/modules/work-order/application/hooks/useWorkOrderService.ts`

## 迁移约束

- **不主动改变 hooks 对外 API**：保持返回值和调用方式不变。
- **不引入额外抽象层**：只有当复用配置明显增多时，才引入 `queryOptions` / `mutationOptions`。
- **不一次性全仓替换所有风格**：按阶段推进，每阶段必须可回归验证。
- **文档同步**：每一阶段都更新本设计文档或配套规范文档，避免规范和代码脱节。

## 新增 Hooks 团队约定

1. 默认采用“推导优先”写法，不在 `useQuery(...)` / `useMutation(...)` 调用点显式书写完整泛型。
2. 只有在变量推导不足、`select` 变换或响应式参数约束需要时，才保留最小显式类型；优先标注 `mutationFn` 入参，而不是回退到完整 hook 泛型。
3. query key / mutation key 继续使用项目级结构化数组 key，并满足全局 `Register` 约束。
4. `meta` 类型统一通过 `Register` 维护；跨业务域的插件、cache 回调只保留基础设施边界类型，不把业务实体类型上提到公共层。
5. 当同一组 query 配置需要在 hooks、预取或缓存操作之间复用时，优先考虑官方 `queryOptions` / `mutationOptions` 形式，而不是先引入更重的自定义工厂抽象。
6. 新增或迁移 hooks 时，至少补最小回归测试，覆盖 query key、mutation 参数、`invalidateQueries(...)` / `setQueryData(...)` 及 `meta` 契约中的关键行为。

## 风险与应对

### 风险 1：全局类型切换后，旧 hooks 的显式泛型与新 Register 约束冲突
**应对**：阶段 1 只收紧基础设施边界，不立即全仓改写；先以 `pnpm type-check` 暴露问题，再分模块迁移。

### 风险 2：测试桩沿用宽松 `Record<string, unknown>`，导致与新 meta 类型不兼容
**应对**：优先调整 `useRequestPlugin.spec.ts` 及相关 hooks 单测中的 stub 类型，让测试桩先对齐运行时真实结构。

### 风险 3：个别 hooks 的返回值推导依赖 service 层弱类型声明
**应对**：只在必要位置保留显式泛型，不把“推导优先”执行成“零泛型教条”。

## 验证策略

- 阶段 1：
  - `pnpm test:unit -- src/app/plugins/__tests__/useRequestPlugin.spec.ts`
  - `pnpm type-check`
- 阶段 2：按模块跑对应 hooks 单测 + `pnpm type-check`
- 阶段 3：按模块跑对应 hooks 单测 + `pnpm type-check`
- 阶段 4：
  - `rg -n "useQuery<|useMutation<" src/modules`
  - `pnpm type-check`
  - 相关单测回归

## 信源（2026-03-17 核对）

### 官方 / 仓库主文档
1. TanStack Query Vue TypeScript 文档：
   https://tanstack.com/query/latest/docs/framework/vue/typescript
2. TanStack Query 官方 Query Options 指南：
   https://tanstack.com/query/latest/docs/framework/react/guides/query-options
3. TanStack Query v5 TypeScript 文档（仓库版本化页面，含 `Register` / `queryOptions` 示例）：
   https://github.com/TanStack/query/blob/v5.71.10/docs/framework/react/typescript.md

### 生态参考
4. Query Key Factory（社区常见结构化 query key 方案）：
   https://github.com/lukemorales/query-key-factory

## 最终建议

对于当前仓库，**最优做法不是强行消灭所有 `unknown`，而是把边界类型留在基础设施层，把强类型放到 `meta` / `key` / `queryFn` / `mutationFn` 推导层**。  
本次改造应优先完成全局 `Register` 收敛与 hooks 层推导化，随后再决定是否需要引入更重的 key factory 或 options 工厂抽象。
