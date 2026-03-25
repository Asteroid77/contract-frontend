# Success Toast 策略（TanStack Query + Naive UI）

> 目标读者：需要维护本仓库请求/反馈链路的工程师。默认你已经理解 TanStack Query 的 Query / Mutation 区别、以及 Naive UI 的 message/notification 基础用法。

## 为什么要“收紧 success toast”

历史实现里，**Mutation 默认成功就 toast**，带来的问题非常典型：

- **噪音**：列表编辑、表单保存、缓存失效后 UI 本来就会变化，toast 只是在重复“你刚才点了按钮”。
- **重复反馈**：页面局部已经 `message.success(...)`，全局再来一次 `notification.success(...)`，用户体验很差。
- **语义不一致**：Query 与 Mutation 的成功提示行为不同（Query 默认不提示、Mutation 默认提示），长期会导致“为什么这个有提示那个没有”的困惑。

业界常见的结论是：**成功提示要克制**，能用 UI 状态变化证明成功时，不要再用 toast 重复确认。

例如 Canva Apps SDK 的 Toast Guidelines 对“不要用 toast 重复确认 UI 已经可见的成功”这件事写得非常直接。  
（见文末「参考信源」）

## 本仓库的结论（最佳实践落地）

1. **Query success toast 默认关闭**（保持现状）。
2. **Mutation success toast 也默认关闭**（这次改造的核心）。
3. 只有在“结果不自明/需要额外确认”的 mutation 上，才 **显式 opt-in** 开启 success toast。

落地机制：利用 TanStack Query 的 `meta` 字段，让全局 `MutationCache/QueryCache` 的回调读取 meta 决定是否 toast。

## 职责边界（你应该把成功提示写在哪）

### 1) 页面局部 feedback（推荐优先）

适用：操作成功后 **本页有明确 UI 变化**（关闭弹窗、刷新列表、按钮状态变化、进入下一步流程等）。

- 优点：语义最贴近用户操作；能用最合适的组件（message / notification / inline）。
- 缺点：可能有少量重复代码（但通常是可接受的）。

### 2) Mutation Hook 内默认 feedback（对“动作=Hook”的场景适用）

适用：某个 Hook 本身就代表一个明确动作（如“发送短信验证码”“领取审批任务”“角色分配”），且多数调用点都需要同一条成功确认。

实现方式：在 `useMutation({... meta: { toastOnSuccess: ... } })` 中定义。

注意：一旦你在 Hook 里定义 `meta.toastOnSuccess`，所有调用点都会 toast；如果某个页面已经有局部 message.success，就会产生重复提示。

### 3) 全局默认 success toast（不推荐）

适用面太广，必然带来噪音和重复，已在本仓库禁用。

## “需要 success toast”的准入规则

下面是我们在仓库里采用的判断规则（建议按从上到下匹配）：

### ✅ 建议 toast 的场景

- **结果不在当前 UI 直接可见**：例如“已发送短信”“已在后台触发导出”“已触发某个异步流程（审批/任务领取/权限分配）”。
- **用户容易误判是否生效**：例如操作没有明显 UI 变化、或变化发生在其它页面/其它模块。
- **动作成功即完成且无需用户继续观察**：提示一次即可让用户放心离开。

### ❌ 不建议 toast 的场景

- **成功后立刻跳转/进入下一步**：下一页/下一步本身就是成功反馈（避免“跳转 + toast”双重确认）。
- **成功会直接刷新当前数据并可见**：表格行更新、列表出现新数据、状态 Tag 改变等。
- **高频行为**：例如 Query 的自动 refetch、轮询、窗口聚焦刷新等。

## 当前代码实现（对应关系）

### 全局 success toast：改为 opt-in

文件：`src/app/plugins/useRequestPlugin.ts`

全局 `globalSuccessHandler(...)` 的行为：

- `meta.toastOnSuccess` 为 `undefined/false`：不提示
- 为 `true`：提示默认成功通知（标题为“成功”，内容优先取 RFC7807 的 `detail`）
- 为 `object`：按 `NaiveNotificationOptions` 渲染
- 为 `function`：回调返回 `NaiveNotificationOptions`

### 已显式开启 success toast 的 mutation（示例）

| 场景 | 文件 | 策略 |
|---|---|---|
| 发送短信验证码 | `src/modules/captcha/application/hooks/useSMS.ts` | `meta.toastOnSuccess`（固定文案） |
| 注册 | `src/modules/user/application/hooks/useRegister.ts` | `meta.toastOnSuccess`（固定文案） |
| 审批：领取任务/处理/撤销 | `src/modules/approval/application/hooks/useApprovalService.ts` | `meta.toastOnSuccess`（处理任务用函数按变量区分通过/拒绝） |
| 邀请码：新增/保存/删除 | `src/modules/invitation/application/hooks/useInvitationService.ts` | `meta.toastOnSuccess`（固定文案） |
| 用户管理：禁用用户 | `src/modules/user/application/hooks/useUserPage.ts` | `meta.toastOnSuccess`（固定文案） |
| 角色分配 | `src/modules/access/application/hooks/useUserRoleService.ts` | `meta.toastOnSuccess`（固定文案） |

## 使用示例（如何开启 / 自定义 / 关闭）

### 1) 开启默认成功 toast（使用 RFC7807 detail）

```ts
useMutation({
  mutationFn: () => repo.doSomething(),
  meta: {
    toastOnSuccess: true,
  },
})
```

### 2) 自定义文案（推荐）

```ts
useMutation({
  mutationFn: () => repo.doSomething(),
  meta: {
    toastOnSuccess: {
      title: $t('common.status.success'),
      content: $t('domain.xxx.message.someSuccess'),
      duration: 5000,
      keepAliveOnHover: true,
    },
  },
})
```

### 3) 依赖 variables 的文案（例如通过/拒绝）

```ts
useMutation({
  mutationFn: (form: Form) => repo.submit(form),
  meta: {
    toastOnSuccess: (_data, mutation) => {
      const variables = mutation.state.variables as Form | undefined
      return {
        title: $t('common.status.success'),
        content: variables?.approved ? $t('domain.approval.message.approveSuccess') : $t('domain.approval.message.rejectSuccess'),
        duration: 5000,
        keepAliveOnHover: true,
      }
    },
  },
})
```

### 4) 明确关闭（通常不需要写，默认就是关闭）

```ts
useMutation({
  mutationFn: () => repo.doSomething(),
  meta: {
    toastOnSuccess: false,
  },
})
```

## FAQ

### Q: 为什么不用 axios interceptor 统一做 success toast？

因为 interceptor 无法表达 TanStack Query 的语义（例如：一次 mutation 的成功可能伴随多次 retry、或被上层 onSuccess 覆盖；Query/Mutation 的生命周期也不等同于“某次 HTTP 请求完成”）。

我们把“请求执行/认证刷新/错误映射”放在 `useRequest`，把“Query/Mutation 生命周期反馈”放在 `useRequestPlugin`，用 `meta` 作为跨层契约，职责更干净。

### Q: 我已经在页面里 `message.success` 了，还要不要 meta.toastOnSuccess？

不要。二选一。  
建议：**页面局部 message.success** 优先，因为它更贴合交互上下文。

## 参考信源（官方文档 / 企业设计系统 / 社区实践）

> 这些链接用于支撑“成功提示要克制、全局回调可读 meta、以及全局 toast 模式”的结论；文档主体不依赖逐字引用。

### TanStack Query（官方）

- QueryCache：onSuccess/onError/onSettled（全局回调）  
  https://tanstack.com/query/latest/docs/reference/QueryCache
- MutationCache：全局回调会始终执行（不同于 defaultOptions 可被覆盖）  
  https://tanstack.com/query/latest/docs/reference/MutationCache
- meta（Query / Mutation 的扩展字段）  
  https://tanstack.com/query/latest/docs/framework/react/reference/useQuery  
  https://tanstack.com/query/latest/docs/framework/react/reference/useMutation

### 企业/设计系统（“success 要克制”的共识）

- Canva Apps SDK UI Kit Guidelines：Toasts  
  https://www.canva.dev/docs/apps/design-guidelines/toasts/
- Shopify App Design Guidelines / Polaris：Toast  
  https://polaris.shopify.com/components/feedback-indicators/toast  
  https://shopify.dev/docs/api/app-bridge-library/reference/toast
- GitHub Primer（可访问性与反馈组件）  
  https://primer.style/foundations/accessibility/toast/
- IBM Carbon：Notification Pattern  
  https://carbondesignsystem.com/patterns/notification-pattern/
- Atlassian Design System：Flag（全局提示/反馈）  
  https://atlassian.design/components/flag/

### 社区实践（TanStack Query + 全局 toast）

- Atomic Object：Toast notifications with TanStack Query  
  https://spin.atomicobject.com/toast-notifications-tanstack-query/
