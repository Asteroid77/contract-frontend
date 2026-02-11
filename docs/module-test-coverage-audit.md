# 全模块高价值单测覆盖审计（2026-02-11）

## 1. 审计目标
- 回答问题：是否“全部模块的高价值区域”都已具备单测覆盖。
- 约束：遵循当前仓库策略，仅保留高价值用例，剔除纯壳组件/静态页/重复断言。

## 2. 价值判定标准
- **高价值（应测）**：
  - 业务分支逻辑（成功/失败/保护分支）
  - 路由副作用（redirect、guard、meta驱动行为）
  - 查询参数与数据转换（props/query 解析）
  - Token/权限/会话等安全相关逻辑
  - 跨模块关键编排（store + service + route）
- **低价值（可不测）**：
  - 纯样式壳、简单透传包装页
  - 静态错误页与演示页
  - DTO/enum/type/文案文件
  - 与已有用例语义重复的断言

## 3. 审计方法
1. 统计全仓测试文件分布与模块密度。
2. 以“代码文件↔测试 import”做静态映射，筛出候选缺口。
3. 对候选逐个人工复核，区分“真实缺口”与“可解释低估”（如动态 import、被集成测试覆盖）。
4. 对真实高价值缺口进行最小补测。

## 4. 审计结果（模块矩阵）

### 全仓概览
- 测试文件总数：`189`
- 顶层分布：
  - `src/modules`: `131`
  - `src/app`: `30`
  - `src/router`: `9`
  - `src/views`: `16`

### 核心模块结论
- `router`：**已覆盖高价值**
  - 路由模块配置：`src/router/modules/__tests__/core.routes.spec.ts`
  - 业务路由 props/query：`src/router/modules/__tests__/business.routes.spec.ts`
  - 用户路由层级：`src/router/modules/__tests__/user.routes.spec.ts`
  - 未认证路由与回调：`src/router/modules/__tests__/unauth.routes.spec.ts`
  - 守卫编排与分支：`src/router/guards/__tests__/setup.spec.ts`、`src/router/guards/__tests__/SetupAuthGuard.spec.ts`、`src/router/guards/__tests__/SetupAbilityGuard.spec.ts`、`src/router/guards/__tests__/SetupLoadingBarGuards.spec.ts`
  - typed-router 工具：`src/router/__tests__/useTypedRouter.spec.ts`
- `modules/access`：**已覆盖高价值**（token 管理、权限能力、服务/校验、hooks）
- `modules/user`：**已覆盖高价值**（登录、用户资料、密码、附加信息、store）
- `modules/approval`：**已覆盖高价值**（审批流核心逻辑、打印/模板、展示分支）
- `modules/service-agreement`：**已覆盖高价值**（签署与结果路径、diff/print）
- `modules/shared`：**已覆盖高价值**（共享查询/规则/表单/组件关键逻辑）
- `app`：**已覆盖高价值**（request/query/observability/plugin/theme 的核心行为）
- `views`：**按策略收敛后已覆盖高价值**
  - 明细条例见：`docs/views-test-cases-catalog.md`

## 5. 本轮补齐项
- 补强路由核心断言：`src/router/modules/__tests__/core.routes.spec.ts`
  - 增加 `approval` 根路由 `isTransition` 断言
  - 增加 `approval-instance-detail` 的 `parent/hideInMenu` 断言
  - 增加 `router/modules/index.ts` 全量 re-export 断言（`business/user/unauth`）

## 6. 未覆盖但有意不测（符合策略）
- 纯壳/透传页面：
  - `src/views/auth/DashboardView.vue`
  - `src/views/auth/ApprovalInstancePageView.vue`
  - `src/views/auth/InvitationPageView.vue`
- 静态错误页：
  - `src/views/error/403View.vue`
  - `src/views/error/404View.vue`
  - `src/views/error/500View.vue`
- 历史/替代布局壳（已由主布局测试覆盖关键行为）：
  - `src/views/auth/AuthLayoutView.vue`
  - `src/views/unauth/UnauthLayoutView.tsx`
- 类型/文案/协议文件（不作为单测目标）：
  - `src/modules/**/domain/*.ts` 中 DTO/enum/type
  - `src/types/**/*.d.ts`
  - `src/_utils/i18n/*.ts`

## 7. 结论
- 按当前“高价值优先、去冗余”标准：**可以认为核心业务模块的高价值区域已覆盖完成**。
- 剩余未覆盖项以低价值文件为主，且均有明确不测理由，不建议再扩张到 UI 壳层快照型测试。
