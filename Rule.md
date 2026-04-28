# Project Rules

## 模块边界

- 业务代码仅放在 `src/modules/*`。
- 公共能力统一放在 `src/modules/shared`，禁止业务模块间直接引用实现。

## 命名

- 目录与文件使用 kebab-case。
- 组件使用 PascalCase，函数与变量使用 camelCase。

## 改动范围

- 单次改动只修改目标模块与必要共享代码。
- 禁止顺手重构无关模块；跨模块改动需在变更说明中写明原因。

## 全局规则

- R1（discrete）: 非组件上下文的消息/弹窗 必须 走 `src/_utils/discrete_naive_api/index.ts`；不能直接调用组件上下文 API。
- R2（i18n）: 所有用户可见文案 MUST 使用 `$t` 或 `useI18n`；MUST NOT 硬编码可见文本。
- R3（theme）: 颜色与主要样式值 MUST 优先使用 theme token 或 CSS 变量；MUST NOT 在业务代码硬编码主样式值。
- R4（advanced_query）: 搜索筛选 MUST 使用 `ModernQueryBuilder + QueryFilters`（参考 `advanced_query`）；MUST NOT 新增绕过该模式的筛选实现。
- R5 (time): 时间格式的处理参考`src/modules/shared/presentation/time/index.ts`；MUST NOT 自行实现重复功能。
- R6（casl）：权限相关的处理参考`docs/how-to/modules/access/casl-integration.md`；MUST NOT自行实现。
- R7（tanstack query）：请求相关需要根据业务评估是否实现缓存以及缓存的时间，请求后会返回服务器的应答toast（参考`src/app/plugins/useRequestPlugin.ts#globalSuccessHandler以及globalBaseErrorHandler`），所以对于请求后需要提示成功/失败的内容，MUST NOT额外做toast/message。

## CSS 约定

### 值与 Token

- 颜色必须使用 `var(--color-*)`，间距 `var(--spacing-*)`，圆角 `var(--radius-*)`，阴影 `var(--shadow-*)`。不要硬编码 `#xxx`、`rgba()`、`8px` 等字面量（`0`、`100%`、`1fr` 等纯结构值除外）。
- Token 定义见 `src/app/presentation/theme/styles/token.css` 与 `generated-theme.css`。
- **打印豁免**：面向 A4 纸输出的样式（`@media print` 块、`@page` 规则、文件名含 `print`/`Print` 的 CSS 文件）允许硬编码色值，因为打印介质为固定白底黑字，不受主题切换影响。

### 布局

- 表单网格遵循 **form-grid 模式**（参考 `src/modules/user/presentation/styles/auth-form-grid.css`）：
  `container-name` + `container-type: inline-size` → 12 列 grid → 子项 `subgrid` + `:where()` 低特异性 → `@container` 响应式降级。
- 仪表盘/多卡片布局参考 `src/modules/agent-aggregate/presentation/dashboard/styles/AgentAggregateDashboard.css`（12 列 subgrid + container queries）。
- 需要提供 `@supports not (grid-template-columns: subgrid)` 降级。

### 文件组织

- 布局/模块级样式提取为独立 CSS 文件，放在 `presentation/styles/` 目录下。
- 仅当样式极少（<20 行）且与组件强耦合时可用 `<style scoped>`；MUST NOT 使用 `lang="scss"`。
- 禁止使用 CSS Modules（`.module.css`），除非面向打印等隔离场景。

### 命名

- CSS 类名使用 BEM：`模块名__元素--修饰符`（kebab-case）。
- container-name 与根类名一致。
