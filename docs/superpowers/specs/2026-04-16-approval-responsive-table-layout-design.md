# 审批任务路由表格与登录态布局响应式设计

日期：2026-04-16

## 背景

当前登录态页面与审批任务列表的响应式行为只有两档：

- 布局层：桌面常驻侧边栏，移动端抽屉式侧边栏。
- 表格层：桌面完整列，移动端 `subtitle` 风格。

这导致一个明显的中间区间问题：当屏幕宽度已经明显收缩，但尚未进入移动端阈值时，侧边栏仍长期占用横向空间，内容区被压窄，审批类表格在列数较多时会出现视觉拥挤、层次混乱、可读性下降的问题。

本次设计将这个问题拆成两个层面处理：

- 页面级导航占宽问题：由登录态布局统一处理。
- 组件级表格密度问题：由表格自身的容器宽度统一处理。

## 目标

- 在不切换整套移动端交互的前提下，为登录态页面增加“窄桌面”布局。
- 为密集型表格建立统一的三态响应规范：`wide`、`compact`、`stacked`。
- 为审批任务列表提供首个落地样例，确保行为可复制到其他登录态列表页。
- 避免引入按列宽、列数、内容宽度实时测量的复杂 JS 逻辑。

## 非目标

- 不重做登录态 header、breadcrumbs、tabs 的整体交互模型。
- 不修改审批业务状态流转、数据查询链路、repository/hooks 契约。
- 不为所有表格强制采用相同视觉模板；仅统一模式与判断规则。
- 不在本次范围内引入复杂的用户个性化布局持久化策略。

## 现状约束

- 侧边栏展开宽度为 `15rem`，收回宽度为 `4rem`。
- 登录态内容最大宽度 token 为 `75rem`。
- 当前移动端阈值在 [`useIsMobile.ts`](../../../src/app/presentation/hooks/useIsMobile.ts) 中固定为 `768px`。
- 当前审批列表在 [`ApprovalInstancePage.vue`](../../../src/modules/approval/presentation/approval/ApprovalInstancePage.vue) 中只区分“完整列”和“移动端 subtitle”两种模式。
- 当前登录态布局在 [`AuthLayoutView.tsx`](../../../src/views/auth/AuthLayoutView.tsx) 中只有桌面常驻侧边栏与移动端抽屉两档。

## 方案对比

### 方案 A：所有响应式行为继续完全依赖 viewport

- 优点：实现简单，改动集中。
- 缺点：表格无法感知自身实际可用宽度；同一张表放在不同内容区宽度下会产生误判。

### 方案 B：导航和表格都完全依赖容器宽度

- 优点：概念统一。
- 缺点：不适合全局导航；导航形态本质上仍应受窗口尺寸驱动。

### 方案 C：导航使用 viewport，表格使用容器宽度

- 优点：导航与组件各自用最合适的判定维度；实现复杂度可控。
- 缺点：需要维护两类断点语义。

## 最终方案

采用方案 C。

- 登录态布局：按 viewport 切换模式。
- 表格：按容器宽度切换模式。

## 设计一：登录态布局的三档模式

### 断点

- `desktop`：`>= 1200px`
- `compact-desktop`：`768px <= width < 1200px`
- `mobile`：`< 768px`

### 行为

#### `desktop`

- 侧边栏默认展开。
- 保持现有桌面 header、breadcrumbs、tabs。
- 允许用户手动折叠侧边栏。

#### `compact-desktop`

- 侧边栏默认收回，不切为移动端抽屉。
- 保持现有桌面 header、breadcrumbs、tabs。
- 允许用户在当前模式下临时展开侧边栏，但当 viewport 跨模式切换时，重新应用该模式的默认值。

#### `mobile`

- 保持现有移动端抽屉模式。
- 维持现有移动端 header 与 tabs 行为。

### 默认值重置规则

为避免不同断点之间遗留上一个模式的侧边栏状态，本次明确以下规则：

- 进入 `desktop` 时，侧边栏重置为默认展开。
- 进入 `compact-desktop` 时，侧边栏重置为默认收回。
- 进入 `mobile` 时，侧边栏重置为关闭抽屉。

这样可以保证用户在窗口尺寸变化后得到稳定、可预期的布局结果。

### 选择 `1200px` 作为 sweet spot 的原因

当前主布局 token 为：

- 侧边栏展开宽度：`15rem`
- 内容最大宽度：`75rem`

在后台密集信息页中，内容区若继续承受展开侧边栏，会明显压缩表格与筛选区可用空间。`1200px` 左右可以作为“仍保留桌面交互，但需要优先释放内容区宽度”的分界点。这个阈值与现有内容宽度 token 也相对协调，不会造成视觉跳变过早或过晚。

## 设计二：表格统一的三态模式

### 模式

- `wide`
- `compact`
- `stacked`

### 判定维度

表格模式不再仅依赖 viewport，而是依赖表格外层容器的实际宽度。

原因：

- 表格是否拥挤取决于“它自己能拿到多少宽度”，而不是整个窗口有多宽。
- 登录态布局、侧边栏状态、筛选区、父容器 padding 都会改变表格可用空间。
- 单靠 viewport 会把组件级问题错误上升为页面级问题。

### 默认阈值

- `wide`：`>= 56rem`
- `compact`：`40rem <= width < 56rem`
- `stacked`：`< 40rem`

### 模式语义

#### `wide`

- 展示完整桌面列。
- 保留所有关键业务字段的独立列。

#### `compact`

- 保留关键列。
- 将次要字段合并进入主列副标题或状态列的次级信息区域。
- 隐藏低优先级列。
- 仍保留表格结构，而不是直接切成移动端卡片/列表。

#### `stacked`

- 使用移动端已有的 `subtitle`/主副文本风格。
- 优先保障可读性与操作可达性，而不是维持传统多列表格结构。

## 表格实现规则

### 规则 1：不用内容测量决定模式

不采用以下方式：

- 动态统计列数
- 动态推导理论列宽
- 动态测量单元格内容宽度
- 为每次 resize 重算布局代价

原因是这类方案复杂、脆弱，且会把简单的响应式问题演变成运行时布局推理问题。

### 规则 2：只做“宽度分桶”，不做“布局求解”

表格只需要一个轻量的模式判定层，将容器宽度映射为：

- `wide`
- `compact`
- `stacked`

判定结果用于切换列定义和局部模板，而不是用于参与复杂的数值计算。

### 规则 3：每张表声明自己的信息优先级

统一模式不等于统一字段。每张表需要声明：

- 哪些字段必须始终保留为独立列
- 哪些字段可在 `compact` 中合并到主列副标题
- 哪些字段仅在 `wide` 中展示
- `stacked` 时的主列模板是什么

### 规则 4：不是所有表格都必须进入 `stacked`

表格可分为三类：

- 密集操作型列表：优先 `wide -> compact -> stacked`
- 中等信息量列表：优先 `wide -> compact`
- 强对齐矩阵类表格：优先保留表格结构，必要时允许横向滚动

这意味着“统一规范”是统一行为模型，而不是统一渲染结果。

## 审批任务列表落地方案

文件：[`ApprovalInstancePage.vue`](../../../src/modules/approval/presentation/approval/ApprovalInstancePage.vue)

### `wide`

- 保持当前列结构：
  - `processName`
  - `nodeName`
  - 实例状态
  - 任务状态
  - `assigneeName`
  - `applicantName`
  - `createdTime`
  - `operate`

### `compact`

- 主列：`processName`
- 主列副标题：
  - `nodeName`
  - `applicantName`
  - `createdTime`
- 状态列：
  - 上下两行展示实例状态与任务状态 tag
- 操作列：
  - 保留
- 隐藏：
  - `assigneeName`
  - 独立的 `nodeName`
  - 独立的 `applicantName`
  - 独立的 `createdTime`

### `stacked`

- 复用当前移动端主副文本表现。
- 保留状态列的上下两行 tag。
- 保留操作列。

## 实现建议

### 登录态布局

- 在 [`AuthLayoutView.tsx`](../../../src/views/auth/AuthLayoutView.tsx) 中引入明确的 viewport 模式枚举，而不是只保留 `md` 隐藏类名和零散状态。
- 由 viewport 模式决定：
  - 侧边栏默认展开/收回
  - 是否使用移动端抽屉
  - 桌面 header/tabs 是否保留

### 表格模式

- 提供一个轻量的响应式表格模式能力，例如：
  - `useResponsiveTableMode`
  - 或统一的容器宽度观测封装
- 只负责输出模式枚举，不负责列宽计算。
- 允许每个页面根据模式切换列定义。

### 样式与 CSS

- 可配合使用 `container query` 做纯样式层的细节调整，例如字号、间距、换行策略。
- 但 `NDataTable` 的列结构切换仍由 Vue 渲染层负责。

## 验证策略

- 为登录态布局增加断点切换单元测试，覆盖：
  - `desktop -> compact-desktop`
  - `compact-desktop -> mobile`
  - 跨模式时侧边栏默认值重置
- 为审批任务列表增加模式切换测试，覆盖：
  - `wide`
  - `compact`
  - `stacked`
- 验证 `compact` 中：
  - 主列副标题组合正确
  - 状态列仍保留双状态信息
  - 操作列仍可达

## 风险与边界

- `compact` 阈值是默认值，不保证所有表格都完全复用同一数字；但模式命名与行为规则应统一。
- 若后续某些表格属于强对齐矩阵类，允许偏离 `stacked`，改用横向滚动。
- 本次不处理全局“记住用户手动折叠状态”的持久化需求；避免与断点默认行为互相打架。

## 参考依据

- MDN, Container queries  
  https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries
- Tailwind CSS, Responsive design / container queries  
  https://tailwindcss.com/docs/responsive-design
- Android Developers, Navigation for responsive UIs  
  https://developer.android.com/guide/topics/large-screens/navigation-for-responsive-uis
- Android Developers, Build adaptive apps  
  https://developer.android.com/guide/topics/large-screens/user-interface
- CFPB Design System, Tables  
  https://cfpb.github.io/design-system/components/tables
- Ant Design, Table  
  https://4x.ant.design/components/table/
