Status: active
Owner: frontend
Last verified: 2026-04-12
Source of truth: yes

# First-Batch E2E Rollout Implementation Plan

**Goal:** 为前端仓库补齐第一批真正有业务价值的浏览器级回归测试，替换当前模板化的 Playwright 用例，并让鉴权跳转与核心业务导航链路进入工程化保护范围。

**Architecture:** 第一批 E2E 只覆盖最容易产生真实线上回归、且单测难以证明成立的路径：route guard、登录跳转、核心列表到详情链路。测试优先采用稳定的 network mock 与可重复的浏览器断言，不在第一批引入高耦合的后端联调或高波动的复杂业务动作。先建立可靠的 harness、selector 和可持续接入 CI 的 first-batch E2E 子集，再继续扩展更深的 CRUD 与权限场景。

**Tech Stack:** Vue 3、Vue Router、Vite、Playwright、pnpm、GitHub Actions

## File Structure

- Modify: `/home/meteor/DEV/projects/test/contract-frontend/playwright.config.ts`
- Modify: `/home/meteor/DEV/projects/test/contract-frontend/package.json`
- Modify or create: `/home/meteor/DEV/projects/test/contract-frontend/e2e/auth/*`
- Modify or create: `/home/meteor/DEV/projects/test/contract-frontend/e2e/business/*`
- Modify or create: `/home/meteor/DEV/projects/test/contract-frontend/e2e/work-order/*`
- Modify or create: `/home/meteor/DEV/projects/test/contract-frontend/e2e/shared/*`
- Modify or replace: `/home/meteor/DEV/projects/test/contract-frontend/e2e/vue.spec.ts`
- Modify: `/home/meteor/DEV/projects/test/contract-frontend/.github/workflows/ci.yml`
- Modify: `/home/meteor/DEV/projects/test/contract-frontend/docs/reference/testing/views-test-cases-catalog.md`
- Move when complete: `/home/meteor/DEV/projects/test/contract-frontend/docs/plans/active/2026-04-12-first-batch-e2e-rollout.md`

## Task 1: 建立稳定的 Playwright 测试基座

**Files:**

- Modify: `/home/meteor/DEV/projects/test/contract-frontend/playwright.config.ts`
- Modify: `/home/meteor/DEV/projects/test/contract-frontend/package.json`
- Modify or create: `/home/meteor/DEV/projects/test/contract-frontend/e2e/shared/*`

- [ ] **Step 1: 先确认当前 E2E 仍以模板 smoke 为主**

Run:

```bash
rg -n "vue\\.spec|Playwright|Welcome|example test|test:e2e" \
  "/home/meteor/DEV/projects/test/contract-frontend/e2e" \
  "/home/meteor/DEV/projects/test/contract-frontend/package.json" \
  "/home/meteor/DEV/projects/test/contract-frontend/playwright.config.ts"
```

Expected:

```text
能看出当前 E2E 仍以模板 smoke 或最小可运行样板为主，尚未形成 first-batch 业务用例基座。
```

- [ ] **Step 2: 收敛执行脚本、共享 helper 和 selector 约定**

Run:

```bash
rg -n "test:e2e|test:e2e:subset|data-testid|storageState|fixture|helper|mock" \
  "/home/meteor/DEV/projects/test/contract-frontend/package.json" \
  "/home/meteor/DEV/projects/test/contract-frontend/playwright.config.ts" \
  "/home/meteor/DEV/projects/test/contract-frontend/e2e"
```

Expected:

```text
可以看到 first-batch 所需的稳定执行入口、共享 helper/fixture，以及明确的 selector 约定。
```

- [ ] **Step 3: 验证本地 harness 可执行**

Run:

```bash
cd "/home/meteor/DEV/projects/test/contract-frontend"
pnpm test:e2e -- --project=chromium
```

Expected:

```text
Playwright 能启动当前前端应用，并至少可稳定执行 first-batch 的最小浏览器级用例。
```

## Task 2: 用鉴权跳转用例替换模板 smoke 测试

**Files:**

- Modify or replace: `/home/meteor/DEV/projects/test/contract-frontend/e2e/vue.spec.ts`
- Modify or create: `/home/meteor/DEV/projects/test/contract-frontend/e2e/auth/*`

- [ ] **Step 1: 先确认未登录受保护页仍缺少浏览器级保护**

Run:

```bash
rg -n "/dashboard|/login|redirect|SetupAuthGuard" \
  "/home/meteor/DEV/projects/test/contract-frontend/e2e" \
  "/home/meteor/DEV/projects/test/contract-frontend/src/router/guards/SetupAuthGuard.ts"
```

Expected:

```text
要么没有对应 E2E 覆盖，要么只有模板 smoke，尚未对未登录访问受保护页的跳转行为建立浏览器级断言。
```

- [ ] **Step 2: 新增未登录访问受保护页的 redirect 用例**

Run:

```bash
rg -n "/dashboard|/login|redirect" \
  "/home/meteor/DEV/projects/test/contract-frontend/e2e/auth" \
  "/home/meteor/DEV/projects/test/contract-frontend/e2e/vue.spec.ts"
```

Expected:

```text
新用例明确覆盖未登录访问受保护页时跳转到 `/login`，并断言 URL 中保留原始 `redirect` 目标。
```

- [ ] **Step 3: 以浏览器级断言验证鉴权跳转**

Run:

```bash
cd "/home/meteor/DEV/projects/test/contract-frontend"
pnpm exec playwright test --project=chromium "/home/meteor/DEV/projects/test/contract-frontend/e2e/auth"
```

Expected:

```text
用例不只检查 URL，还能证明登录页关键元素已渲染，说明路由守卫与页面装配同时成立。
```

## Task 3: 补充登录成功与回跳覆盖

**Files:**

- Modify or create: `/home/meteor/DEV/projects/test/contract-frontend/e2e/auth/*`
- Modify or create: `/home/meteor/DEV/projects/test/contract-frontend/e2e/shared/*`

- [ ] **Step 1: 先确认登录成功与回跳覆盖仍不完整**

Run:

```bash
rg -n "/login|/dashboard|redirect|验证码|password|captcha" \
  "/home/meteor/DEV/projects/test/contract-frontend/e2e/auth" \
  "/home/meteor/DEV/projects/test/contract-frontend/src/views/unauth"
```

Expected:

```text
当前登录成功、redirect 回跳或已登录访问未认证页面的浏览器级用例仍缺失或不完整。
```

- [ ] **Step 2: 新增登录成功、回跳与已登录访问 `/login` 的用例**

Run:

```bash
rg -n "/dashboard|redirect|/login|storageState|mock" \
  "/home/meteor/DEV/projects/test/contract-frontend/e2e/auth" \
  "/home/meteor/DEV/projects/test/contract-frontend/e2e/shared"
```

Expected:

```text
用例与 helper 能看出三类覆盖：登录成功进入目标页、登录后 redirect 回跳、已登录访问 `/login` 时被送回受保护页。
```

- [ ] **Step 3: 执行 auth first-batch 用例**

Run:

```bash
cd "/home/meteor/DEV/projects/test/contract-frontend"
pnpm exec playwright test --project=chromium "/home/meteor/DEV/projects/test/contract-frontend/e2e/auth"
```

Expected:

```text
登录成功与回跳路径进入稳定的浏览器级保护，且断言聚焦用户路径是否成立，而不是脆弱的视觉细节。
```

## Task 4: 补齐售电协议列表到详情主链路

**Files:**

- Modify or create: `/home/meteor/DEV/projects/test/contract-frontend/e2e/business/*`

- [ ] **Step 1: 先确认售电协议主链路尚未进入 E2E**

Run:

```bash
rg -n "/sign/page|/sign\\?id=|service agreement|售电协议" \
  "/home/meteor/DEV/projects/test/contract-frontend/e2e" \
  "/home/meteor/DEV/projects/test/contract-frontend/src/router/modules/business.routes.ts"
```

Expected:

```text
能够识别出售电协议列表到详情的浏览器级覆盖仍缺失，或尚未形成稳定的 mock + 断言组合。
```

- [ ] **Step 2: 新增列表加载与详情跳转用例**

Run:

```bash
rg -n "/sign/page|/sign\\?id=|mock|detail|list" \
  "/home/meteor/DEV/projects/test/contract-frontend/e2e/business"
```

Expected:

```text
新用例覆盖列表加载、进入详情的关键操作以及详情页关键区域断言，并使用稳定 mock 数据。
```

- [ ] **Step 3: 执行业务主链路用例**

Run:

```bash
cd "/home/meteor/DEV/projects/test/contract-frontend"
pnpm exec playwright test --project=chromium "/home/meteor/DEV/projects/test/contract-frontend/e2e/business"
```

Expected:

```text
售电协议核心导航链路进入浏览器级保护，列表渲染、用户操作和详情跳转的跨模块集成点得到验证。
```

## Task 5: 补齐工单列表到详情主链路

**Files:**

- Modify or create: `/home/meteor/DEV/projects/test/contract-frontend/e2e/work-order/*`

- [ ] **Step 1: 先确认工单主链路尚未进入 E2E**

Run:

```bash
rg -n "/work-order|work order|工单" \
  "/home/meteor/DEV/projects/test/contract-frontend/e2e" \
  "/home/meteor/DEV/projects/test/contract-frontend/src/router/modules/work-order.routes.ts"
```

Expected:

```text
当前工单列表到详情的浏览器级覆盖仍缺失，或还没有稳定的 mock 与断言组合。
```

- [ ] **Step 2: 新增列表渲染与详情跳转用例**

Run:

```bash
rg -n "/work-order|detail|list|mock" \
  "/home/meteor/DEV/projects/test/contract-frontend/e2e/work-order"
```

Expected:

```text
新用例覆盖工单列表渲染、进入详情的用户入口，以及详情页关键区域与必要状态断言。
```

- [ ] **Step 3: 执行工单主链路用例**

Run:

```bash
cd "/home/meteor/DEV/projects/test/contract-frontend"
pnpm exec playwright test --project=chromium "/home/meteor/DEV/projects/test/contract-frontend/e2e/work-order"
```

Expected:

```text
工单模块至少一条列表到详情主路径进入真实浏览器保护，跨页联动得到验证。
```

## Task 6: 将首批 E2E 接入 CI

**Files:**

- Modify: `/home/meteor/DEV/projects/test/contract-frontend/.github/workflows/ci.yml`
- Modify: `/home/meteor/DEV/projects/test/contract-frontend/package.json`
- Modify: `/home/meteor/DEV/projects/test/contract-frontend/playwright.config.ts`

- [ ] **Step 1: 先确认 CI 尚未定义稳定的 first-batch E2E 门禁**

Run:

```bash
rg -n "playwright|test:e2e|test:e2e:subset|chromium" \
  "/home/meteor/DEV/projects/test/contract-frontend/.github/workflows/ci.yml" \
  "/home/meteor/DEV/projects/test/contract-frontend/package.json"
```

Expected:

```text
当前 CI 还没有明确、稳定、命名清晰的 first-batch E2E 入口，或仍停留在模板 smoke 层级。
```

- [ ] **Step 2: 增加 CI-safe 的 first-batch 执行命令和 workflow 步骤**

Run:

```bash
rg -n "test:e2e:subset|pnpm .*test:e2e:subset|playwright" \
  "/home/meteor/DEV/projects/test/contract-frontend/package.json" \
  "/home/meteor/DEV/projects/test/contract-frontend/.github/workflows/ci.yml"
```

Expected:

```text
可以看到单独命名的 CI-safe 命令，以及 workflow 中对应的 first-batch E2E 步骤。
```

- [ ] **Step 3: 用 CI 同等参数进行本地验证**

Run:

```bash
cd "/home/meteor/DEV/projects/test/contract-frontend"
pnpm test:e2e:subset
```

Expected:

```text
本地能以 CI 同等入口稳定跑通 first-batch 子集，且不会把高波动场景一并塞进第一阶段门禁。
```

## Task 7: 完成后同步测试参考文档并 completed 化

**Files:**

- Modify: `/home/meteor/DEV/projects/test/contract-frontend/docs/reference/testing/views-test-cases-catalog.md`
- Move when complete: `/home/meteor/DEV/projects/test/contract-frontend/docs/plans/active/2026-04-12-first-batch-e2e-rollout.md`

- [ ] **Step 1: 在 reference 文档记录稳定覆盖范围**

Run:

```bash
rg -n "E2E|dashboard|login|redirect|sign|work-order" \
  "/home/meteor/DEV/projects/test/contract-frontend/docs/reference/testing/views-test-cases-catalog.md"
```

Expected:

```text
参考文档能明确看出哪些路由和业务链路已由 E2E 保护，以及哪些场景仍未纳入浏览器级覆盖。
```

- [ ] **Step 2: 将 active plan 移入 completed**

Run:

```bash
ls "/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-12-first-batch-e2e-rollout.md"
```

Expected:

```text
当 first-batch 全部落地并稳定后，plan 已从 active 迁入 completed，active 目录不再继续承载已收口计划。
```

- [ ] **Step 3: 在 completed 留痕中写清验证边界**

Run:

```bash
rg -n "Completion Summary|redirect|dashboard|sign|work-order|test:e2e:subset" \
  "/home/meteor/DEV/projects/test/contract-frontend/docs/plans/completed/2026-04-12-first-batch-e2e-rollout.md"
```

Expected:

```text
completed 留痕能明确说明哪些路径已受 E2E 保护、使用了哪套验证入口，以及当前仍未纳入首批范围的场景。
```

## Self-Review

### Spec coverage

- 鉴权跳转、登录成功与回跳：Task 2、Task 3
- 售电协议与工单主链路：Task 4、Task 5
- CI first-batch 门禁：Task 6
- 覆盖留痕与计划收口：Task 7

### Placeholder scan

- 已移除旧的 `Scope / Constraints / Validation / Exit Criteria` 松散结构，收敛为可执行任务
- 每个任务都包含 `Files / Step / Run / Expected`

### Type consistency

- 路由与模块命名统一使用：
  - `/dashboard`
  - `/login`
  - `/sign/page`
  - `/work-order`
- 验证入口统一使用：
  - `pnpm test:e2e -- --project=chromium`
  - `pnpm exec playwright test --project=chromium <scope>`
  - `pnpm test:e2e:subset`
