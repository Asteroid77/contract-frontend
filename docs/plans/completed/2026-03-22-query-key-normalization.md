Status: completed
Owner: frontend
Last verified: 2026-04-08
Source of truth: yes

# Query Key Normalization Implementation Plan

**Goal:** Normalize query key structure so cache identity, invalidation scope, and query-request-context hashing stay stable and predictable.

**Architecture:** Keep the existing “query key factory per module” pattern, but tighten the tree shape: one bounded root namespace per domain, stable list/detail segmentation, normalized parameter segments, and no auth-token-based cache partitioning for identity-stable resources. The plan prioritizes fixes that affect cache correctness before style-only cleanup.

**Tech Stack:** Vue 3, @tanstack/vue-query v5, Vitest

---

## Constraints

- Do **not** touch unrelated business logic.
- Do **not** introduce a generic “query key framework”. Keep the current per-module factory style.
- Do **not** plan git commit steps here; current workspace rules require explicit user request.
- Any key shape change must be accompanied by test updates, because several specs currently assert the old shape.

---

### Task 1: 建立统一的 query key 约束基线

**Files:**
- Modify: `docs/explanation/modules/access/request-auth-refresh.md` (如需补充 requestId/hash 与 queryKey 关系)
- Create: `docs/plans/2026-03-22-query-key-normalization.md` (本文件)
- Test: N/A

**Step 1: 记录约束**

约束应明确为：

- 顶层必须是数组，且首段必须是稳定字符串域前缀
- 资源身份进入 key；认证凭证本身不进入 key
- 列表参数用对象段承载；数组参数若语义上“无序”，先归一化再入 key
- `invalidateQueries({ queryKey })` 依赖前缀树结构，因此 key tree 必须一致
- 禁止使用泛化兜底 key（如 `['empty']`）

补充一条更易记忆的排序口径：

1. **域 / 命名空间**
2. **资源集合**
3. **视图 / 操作语义**
4. **资源身份或查询参数**

可以简化记成：

> 先放“谁家的数据”，再放“哪类资源”，再放“我是查详情/列表/历史还是别的视图”，最后放 `id` 或 `params`。

例如：

```ts
['approval', 'instances', 'detail', 101]
['approval', 'instances', 'page', { page: 1, size: 10 }]
['approval', 'tasks', 888, 'history']
```

注意：这不是为了“好看”，而是为了让 prefix invalidation 有稳定含义：

- `['approval']` = 整个 approval 域
- `['approval', 'instances']` = 所有实例相关缓存
- `['approval', 'instances', 'detail']` = 所有实例详情
- `['approval', 'instances', 'detail', 101]` = 某个实例详情

### 关系型资源是否适用

适用，但“身份段”不一定总是单个 `id`，也可以是**父资源身份**、**复合身份对象**或**关系边 identity**。

建议按“这段关系在缓存树里归谁管理”来决定：

#### 1. 明显从属于父资源的关系视图

如果它主要是某个父资源下的附属数据，优先挂在父资源子树下：

```ts
['role', 'detail', roleId, 'permissions']
['approval', 'instances', 'detail', instanceId, 'comments']
```

这种写法适合：

- 关系数据主要随父资源详情一起失效
- 大多数场景下都是“从父资源进入，再看这段关系”

#### 2. 关系本身是独立资源

如果这段关系会被多个页面独立读取、独立失效，给它单独的资源根更清晰：

```ts
['userRole', 'assignedUsers', { roleId }]
['userRole', 'assignedRoles', { userId }]
['membership', 'detail', { userId, roleId }]
```

这种写法适合：

- 它本身就是一个独立查询入口
- 它不是单纯“某个详情页的附属块”
- 失效粒度更接近 relation 本身，而不是父详情

#### 3. 无序关系必须归一化

如果一段关系的语义与顺序无关，identity 进入 key 前先归一化：

```ts
['comparison', 'pair', { ids: [a, b].sort((x, y) => x - y) }]
```

如果顺序本身有语义（例如 `fromUserId -> toUserId`），就**不要排序**，保留方向。

**Step 2: 不改代码，只确认影响范围**

检查以下模块会被影响：

- `src/modules/approval/application/hooks/useApprovalService.ts`
- `src/modules/file/application/hooks/useFileService.ts`
- `src/modules/user/application/hooks/useLoadUserInfo.ts`
- `src/modules/access/application/hooks/useUserRoleService.ts`
- `src/modules/work-order/application/hooks/useWorkOrderService.ts`
- `src/modules/access/application/hooks/useRoleService.ts`
- 对应测试文件

**Step 3: 验证当前基线**

Run:
```bash
pnpm -s vitest run \
  "src/modules/approval/application/hooks/__tests__/useApprovalService.spec.ts" \
  "src/modules/file/application/hooks/__tests__/useFileService.spec.ts" \
  "src/modules/user/application/hooks/__tests__/query-hooks.spec.ts" \
  "src/modules/access/application/hooks/__tests__/useUserRoleService.spec.ts" \
  "src/modules/access/application/hooks/__tests__/useRoleService.spec.ts" \
  "src/modules/work-order/application/hooks/__tests__/useWorkOrderService.spec.ts"
```

Expected:
- 记录当前通过情况，作为后续 refactor 回归基线。

---

### Task 2: 重构 approval query key 树，消除 `instance` / `instances` 混用

**Files:**
- Modify: `src/modules/approval/application/hooks/useApprovalService.ts`
- Test: `src/modules/approval/application/hooks/__tests__/useApprovalService.spec.ts`

**Step 1: 先写/改测试，锁定前缀失效语义**

新增或调整测试，覆盖至少这几件事：

- `approvalInstanceKeys.ALL` 能匹配所有实例相关查询
- `INSTANCE_PAGE(...)` 与 `INSTANCE_DETAIL(...)` 在同一棵 `instances` 前缀树下
- `invalidateQueries({ queryKey: approvalInstanceKeys.ALL })` 能覆盖实例分页与详情

**Step 2: 最小改造 key tree**

建议改成同一根：

```ts
export const approvalKeys = {
  all: ['approval'] as const,
  tasks: () => [...approvalKeys.all, 'tasks'] as const,
  taskHistory: (taskId: number) => [...approvalKeys.tasks(), taskId, 'history'] as const,
  instances: () => [...approvalKeys.all, 'instances'] as const,
  instancePage: (params: ApprovalInstancesPageRequest) => [...approvalKeys.instances(), 'page', params] as const,
  instanceDetail: (instanceId: number) => [...approvalKeys.instances(), 'detail', instanceId] as const,
  latestAdditionalInfoInstance: () => [...approvalKeys.instances(), 'latest-additional-info'] as const,
}
```

如果不想一次性合并所有 key factory，至少保证：

- `approvalInstanceKeys.ALL`
- `approvalInstanceKeys.INSTANCE_PAGE`
- `approvalInstanceKeys.INSTANCE_DETAIL`
- `approvalInstanceKeys.LATEST_ADDITIONAL_INFO_INSTANCE`

处于同一前缀树。

**Step 3: 同步失效逻辑**

把所有相关 `invalidateQueries` 改到新的统一前缀上，避免依赖 `['approval']` 这种过粗范围兜底。

**Step 4: 运行局部测试**

Run:
```bash
pnpm -s vitest run "src/modules/approval/application/hooks/__tests__/useApprovalService.spec.ts"
```

Expected:
- approval hooks 测试通过
- key shape 断言与 invalidation 断言更新完成

---

### Task 3: 归一化 file 批量 key，避免同一组 ID 因顺序不同产生不同缓存

**Files:**
- Modify: `src/modules/file/application/hooks/useFileService.ts`
- Test: `src/modules/file/application/hooks/__tests__/useFileService.spec.ts`

**Step 1: 先写失败测试**

新增测试覆盖：

- `fileKeys.batchDetail([1, 2, 3])` 与 `fileKeys.batchDetail([3, 2, 1])` 应表达同一语义时，生成同一 key
- `batchMetaDetail` 同理

**Step 2: 做最小实现**

把批量 key 从：

```ts
['files', 'detail', 'batch', ...ids]
```

改成稳定对象段，例如：

```ts
['files', 'detail', 'batch', { ids: [...ids].sort((a, b) => a - b) }]
```

`batchMetaDetail` 同理。

**Step 3: 验证单条缓存写回不受影响**

确认以下行为仍成立：

- `setQueryData(fileKeys.detail(file.id), file)` 正常
- 批量返回写回单文件 detail/meta detail 缓存正常

**Step 4: 运行局部测试**

Run:
```bash
pnpm -s vitest run "src/modules/file/application/hooks/__tests__/useFileService.spec.ts"
```

Expected:
- 批量 key 稳定性测试通过
- 现有文件缓存行为测试不回退

---

### Task 4: 去掉 `useLoadUserInfo` 对 access token 的 key 分区

**Files:**
- Modify: `src/modules/user/application/hooks/useLoadUserInfo.ts`
- Test: `src/modules/user/application/hooks/__tests__/query-hooks.spec.ts`

**Step 1: 先改测试，表达新语义**

把当前“token 进入 queryKey 做 cache partitioning”的断言改成：

- 当前用户信息是稳定资源，key 不因 access token 刷新而变化
- token 变化不应制造新的缓存身份

**Step 2: 最小实现**

建议改成：

```ts
export const userKeys = {
  ALL: ['user'] as const,
  INFO: ['user', 'info', 'current'] as const,
}
```

并把 `useLoadUserInfo` 的 `queryKey` 改为固定 identity key。

**Step 3: 检查 watcher 行为**

确认下面逻辑不受影响：

- profile 返回后更新 accountStore token
- refresh token 缺失时保留旧 refresh token
- reactive token 输入变化不会破坏 hook 正常运行

注意：这里“输入 token 变化”仍可能影响请求结果，但不应再影响缓存身份。

**Step 4: 运行局部测试**

Run:
```bash
pnpm -s vitest run "src/modules/user/application/hooks/__tests__/query-hooks.spec.ts"
```

Expected:
- `useLoadUserInfo` 的 key 断言更新为固定 identity key
- token 同步相关测试保持通过

---

### Task 5: 收紧空值兜底 key，禁止 `['empty']`

**Files:**
- Modify: `src/modules/access/application/hooks/useUserRoleService.ts`
- Test: `src/modules/access/application/hooks/__tests__/useUserRoleService.spec.ts`

**Step 1: 先写/改测试**

验证：

- 当 `roleId` 无效时，query 处于 disabled
- 即便生成兜底 key，仍保留模块语义，不使用全局泛 key

**Step 2: 最小实现**

把：

```ts
['empty']
```

改成语义化兜底，例如：

```ts
['userRole', 'assignedUsers', 'empty']
```

或者保持 `assignedUsersByRole` 风格，并用更明确的占位段。

**Step 3: 运行局部测试**

Run:
```bash
pnpm -s vitest run "src/modules/access/application/hooks/__tests__/useUserRoleService.spec.ts"
```

Expected:
- 无效 roleId 场景行为不变
- key shape 更可控，不与其他模块共享 `['empty']`

---

### Task 6: 决定并落实 work-order 的 user/handler 资源是否共享 key

**Files:**
- Modify: `src/modules/work-order/application/hooks/useWorkOrderService.ts`
- Optionally Modify: `src/modules/work-order/infrastructure/work-order-repository.ts`
- Optionally Modify: `src/modules/work-order/infrastructure/handler-repository.ts`
- Test: `src/modules/work-order/application/hooks/__tests__/useWorkOrderService.spec.ts`

**Step 1: 先做语义判断**

确认以下问题：

- `getDetail(id)` 与 `getHandlerDetail(id)` 是否保证长期返回同一资源形状？
- `getReplies(id)` 与 `getHandlerReplies(id)` 是否保证长期返回同一资源语义？

如果答案不是“明确且长期一致”，就不要共用 key。

**Step 2A: 如果确认是同一资源语义**

保留共用：

- `DETAIL(id)`
- `REPLIES(id)`

但需要补测试，证明 user / handler 两个查询共享缓存是有意设计。

**Step 2B: 如果确认只是接口暂时长得像**

拆分 key：

```ts
['work-orders', 'user', 'detail', id]
['work-orders', 'handler', 'detail', id]
['work-orders', 'user', 'replies', id]
['work-orders', 'handler', 'replies', id]
```

并同步更新：

- 所有 `useQuery`
- 所有 `setQueryData`
- 所有 `invalidateQueries`

**Step 3: 运行局部测试**

Run:
```bash
pnpm -s vitest run "src/modules/work-order/application/hooks/__tests__/useWorkOrderService.spec.ts"
```

Expected:
- 详情/回复缓存行为与选择的语义一致
- 不再出现潜在跨上下文缓存碰撞

---

### Task 7: 修复 role 相关失效参数语义不一致

**Files:**
- Modify: `src/modules/access/application/hooks/useRoleService.ts`
- Test: `src/modules/access/application/hooks/__tests__/useRoleService.spec.ts`

**Step 1: 先写失败测试**

覆盖：

- 编辑角色后，真正应该失效的是“受影响用户的角色列表”还是“当前 role detail / role list”
- 不应把 `roleId` 当 `userId` 传给 `roleKeys.userRoles(...)`

**Step 2: 最小实现**

根据真实业务语义二选一：

- 如果这里根本拿不到 userId，就删掉这条错误 invalidation
- 如果确实需要失效用户角色列表，就在 mutation variables 中显式传入 userId，再用正确 key 失效

**Step 3: 运行局部测试**

Run:
```bash
pnpm -s vitest run "src/modules/access/application/hooks/__tests__/useRoleService.spec.ts"
```

Expected:
- invalidation 参数语义正确
- 不再出现 roleId/userId 混淆

---

### Task 8: 跑回归验证，确认 hash / requestId / query 行为整体稳定

**Files:**
- Verify only
- Optional Modify: `src/app/infrastructure/query/__tests__/query-request-context.spec.ts`

**Step 1: 跑聚焦回归**

Run:
```bash
pnpm -s vitest run \
  "src/modules/approval/application/hooks/__tests__/useApprovalService.spec.ts" \
  "src/modules/file/application/hooks/__tests__/useFileService.spec.ts" \
  "src/modules/user/application/hooks/__tests__/query-hooks.spec.ts" \
  "src/modules/access/application/hooks/__tests__/useUserRoleService.spec.ts" \
  "src/modules/access/application/hooks/__tests__/useRoleService.spec.ts" \
  "src/modules/work-order/application/hooks/__tests__/useWorkOrderService.spec.ts" \
  "src/app/infrastructure/query/__tests__/query-request-context.spec.ts"
```

Expected:
- 所有 query key shape 相关断言通过
- query-request-context 未因 key 改造出现 hash/requestId 回归

**Step 2: 跑类型检查**

Run:
```bash
pnpm -s type-check
```

Expected:
- 通过

---

## Recommended Execution Order

1. Task 2 `approval` key tree
2. Task 3 `file` batch key normalization
3. Task 4 `useLoadUserInfo` identity key
4. Task 5 remove `['empty']`
5. Task 6 decide work-order split/share strategy
6. Task 7 fix role invalidation mismatch
7. Task 8 full regression

## Why This Order

- **Task 2** directly affects invalidation correctness; it is the most structural cache bug.
- **Task 3** prevents silent duplicate caches for equivalent file batches.
- **Task 4** fixes an identity modeling issue that will otherwise keep producing fragmented user-profile caches.
- **Task 5** is low risk cleanup but improves namespace hygiene.
- **Task 6** needs a semantic decision, so it should happen after the high-confidence fixes.
- **Task 7** is small but depends on clarifying actual invalidation intent.
- **Task 8** is the final proof that key hashing and query behavior remain stable.
