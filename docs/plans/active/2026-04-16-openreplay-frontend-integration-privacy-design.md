
Owner: frontend
Last verified: 2026-04-19
Source of truth: yes

# OpenReplay Frontend Integration And Privacy Design

## 背景

当前项目已经具备 OpenReplay 自托管评估环境与同源 replay 链路：

- frontend 默认 ingest 入口为 `/observability/frontend/replay`
- 本机 Nginx 负责将同源 replay 前缀映射到 VM 上 OpenReplay 官方 `/ingest`
- 浏览器在评估链路中已能创建有效 `openreplay_session_id`

但当前阶段的默认生产路径并不启用 replay：

- 当前默认生产观测主路径仍是 `SigNoz + frontend-observability + traces`
- OpenReplay 保留为可选评估能力
- 本文档描述的是“后续条件启用时应遵循的接入与隐私治理方案”

但前端侧仍缺少一份明确的接入与隐私治理设计。当前问题主要集中在四类：

1. OpenReplay 初始化边界尚未工程化固化，后续容易被塞进错误层级。
2. 业务组件如何最小入侵接入 replay 还没有统一约束。
3. NaiveUI 复杂组件存在 teleport / follower / preview 等多层 DOM，不能用单一“加个指令”概括。
4. B 端敏感表单系统需要明确 replay 录制范围、字段隐私边界、错误事件策略和生产治理策略。

## 目标

- 以最小入侵方式在 frontend 接入 OpenReplay。
- 固化 `bootstrap -> observability facade -> Vue privacy adapter -> business facade` 的分层。
- 明确 `hidden` 与 `obscured` 的工程语义。
- 为 NaiveUI 关键复杂组件给出可执行的 replay 隐私矩阵。
- 将 `upload_failure` 等高价值失败场景收敛为 observability 领域事件，而不是 replay 私有逻辑。
- 给出适用于当前 B 端系统的生产录制策略、留存与权限建议。

## 非目标

- 不重复 VM、Docker Compose、Nginx、端口与 OpenReplay prod-like 部署设计。
- 不重写 OpenReplay 原生 ingest/backend 协议。
- 不在本轮直接改完所有页面和组件。
- 不把 replay 单独设计成通用业务事件平台。

## 决策摘要

- OpenReplay 的前端接入边界固定为：
  - `bootstrapObservability(app)` 管启动时机
  - `observability facade` 管业务可见 API
  - `replay-privacy plugin` 管隐私语义与 Vue 指令
- 业务组件不直接依赖 `@openreplay/tracker`。
- `hidden` 与 `obscured` 保持两套不同隐私语义，不合并。
- NaiveUI 复杂组件默认按“触发器层 + teleport / preview 层”分别治理。
- 生产录制策略采用“默认收紧、按价值放开、按事件提级”，而不是全站常驻全量录制。

## 外部依据与分析过程

本设计结论来自三类证据交叉验证：

### 1. 监管与权威机构方向

- `EDPB` 与类似数据保护实践强调：
  - 目的限定
  - 数据最小化
  - 留存限制
  - 访问控制与安全措施
- `ICO` 对 cookies / similar technologies / tracking 的指导强调：
  - 非必要且侵入性较强的追踪应有清晰告知与合法依据
  - 用户应有明确选择
- `NIST Privacy Engineering` 的方向强调：
  - 隐私应在系统设计时固化，而不是事后补洞

这些要求决定了我们不能在敏感 B 端表单系统中采用“全站全量裸录”。

### 2. OpenReplay 官方与主流产品实践

- OpenReplay 官方能力表明：
  - tracker 以应用级单例方式初始化
  - 支持 `start` / `stop` / `event` / `issue` / `setUserID`
  - 支持通过 `data-openreplay-hidden` / `data-openreplay-obscured` / `data-openreplay-htmlmasked` 做元素级隐私控制
  - 支持 `private mode`
- Sentry / Datadog 的 session replay 官方实践普遍采用：
  - 采样
  - 错误提级录制
  - 默认脱敏
  - 手动启动或条件录制

这些共识说明企业主流做法不是“所有用户所有页面一直录”，而是“默认收紧、按价值放开、按事件提级”。

### 3. 本地代码事实

当前仓库和本地依赖中存在以下关键事实：

- frontend 已在应用入口初始化 OpenReplay：
  - `src/main.ts`
  - `src/app/observability/index.ts`
  - `src/app/observability/replay/openreplay.ts`
- `usePlugins` 当前只承担 Vue plugin 安装职责：
  - `src/app/plugins/usePlugins.ts`
- Vue 官方规则决定：组件上的自定义指令只作用到组件根节点，不会自动覆盖 teleport 出去的 DOM。
- NaiveUI 本地实现表明：
  - `NSelect` / `NAutoComplete` / `NTreeSelect` / `NCascader` 暴露 `to` 与 `menuProps`，菜单通过 `VFollower` 渲染
  - `NDatePicker` / `NTimePicker` 也有 `to`，面板通过 `VFollower` 渲染
  - `NImagePreview` 使用 `LazyTeleport`
  - `DataTable` 过滤菜单通过 `NPopover`

因此，“对组件直接加一个 replay 指令就能覆盖全部敏感内容”在 NaiveUI 复杂组件上并不成立。

## 采用方案

采用“两层接入、两层治理”的方案：

### 接入层

1. `bootstrapObservability(app)`
   - 统一控制 replay / trace / logger 的运行时启动
   - 不放进 `usePlugins`
2. `observability facade`
   - 对业务暴露稳定 API
   - 业务组件不直接依赖 `@openreplay/tracker`

### 治理层

1. `replay-privacy plugin`
   - 注册 Vue 指令与必要的包装能力
2. `domain observability facade`
   - 统一 `upload_failure`、`approval_failure`、`submit_failure` 等领域事件

## 架构与职责边界

### 1. Bootstrap 层

建议新增：

- `src/app/observability/bootstrap.ts`

职责：

- 读取 env / feature flag / 登录态 / 路由策略
- 决定是否初始化 replay
- 决定何时 `setUser`
- 决定 replay 是否登录后启动、是否关键路由启用、是否错误场景提级

不建议把 OpenReplay 主初始化放进 `usePlugins`，原因：

- `usePlugins` 当前是 Vue plugin 装配层，不是 runtime service manager
- replay 启动时机未来要受登录态、路由和采样策略影响
- 将 SDK lifecycle 塞进 plugin 安装过程会污染职责边界

### 2. Observability facade 层

保留并强化当前结构：

- `src/app/observability/index.ts`
- `src/app/observability/replay/openreplay.ts`

职责：

- 封装 replay / trace / logger / session 信息
- 对业务暴露稳定能力：
  - `trackEvent`
  - `trackIssue`
  - `getSessionInfo`
  - `captureUploadFailure`
  - `captureApprovalIssue`

业务组件不允许直接：

- `import Tracker from '@openreplay/tracker'`
- 直接调用 `tracker.event(...)`
- 直接调用 `tracker.issue(...)`

### 3. Vue privacy adapter 层

建议新增：

- `src/app/plugins/replay-privacy.ts`

职责：

- 注册 replay 隐私相关的 Vue 指令
- 将 OpenReplay 的 `data-*` 隐私属性包装为项目语义 API

推荐暴露：

- 通用指令：`v-replay-sanitize="'hidden' | 'obscured'"`
- 可选语义别名：
  - `v-replay-hidden`
  - `v-replay-obscured`

推荐底层统一使用一个指令的原因：

- 语义集中
- 更易扩展
- 避免业务到处散落供应商属性名

## Source Of Truth

- OpenReplay 运行时启动边界的唯一真源是：
  - `bootstrapObservability(app)` 及其所在 bootstrap 层
- 业务可见观测 API 的唯一真源是：
  - `src/app/observability/index.ts`
  - `src/app/observability/replay/openreplay.ts`
- replay 隐私语义与 Vue 指令包装的唯一真源是：
  - `src/app/plugins/replay-privacy.ts`
  - 项目级 `v-replay-sanitize / v-replay-hidden / v-replay-obscured`
- 领域失败事件 schema 的唯一真源是 observability facade；`upload_failure`、`approval_failure` 等不允许变成 replay 私有协议。
- 业务组件不允许直接 `import Tracker from '@openreplay/tracker'`，也不允许直接写供应商 `data-openreplay-*` 作为长期主 API。

## 隐私语义设计

### `obscured`

语义：

- 保留结构、布局和交互路径
- 遮住文本内容

适合：

- 普通敏感文本输入
- 普通表单字段
- 仍需要观察用户操作路径的区域

### `hidden`

语义：

- 不在 replay 中保留该区域的实际内容
- 适合高敏内容和预览内容

适合：

- 身份证、银行卡、营业执照、电费单、合同附件
- 图片预览
- 文件名与签名 URL
- 富文本合同正文

### 为什么两者不能合并

- `obscured` 适合“保留操作语义”
- `hidden` 适合“完全不应出现在 replay 中的内容”
- 两者的治理目标不同，统一成一个会导致边界模糊

## NaiveUI 组件隐私矩阵

### 1. `NInput` / `NInputNumber` / `NTextarea`

- 标记位置：外层真实 DOM wrapper
- 默认策略：`obscured`
- 高敏字段：`hidden`

建议：

```vue
<div v-replay-sanitize="'obscured'">
  <n-input v-model:value="form.contactPerson" />
</div>
```

### 2. `NSelect` / `NAutoComplete` / `NTreeSelect` / `NCascader`

本地代码证据：

- 暴露 `to` 与 `menuProps`
- 菜单通过 `VFollower` 渲染

结论：

- 只给组件本体或外层 wrapper 加指令，只能可靠覆盖触发器/root
- 若要保护下拉菜单内容，必须额外处理菜单层

推荐：

- 触发器：外层 wrapper `obscured`
- 菜单：`menuProps` 注入 `data-openreplay-*`

建议新增 helper：

- `createReplayMenuProps('hidden' | 'obscured')`

### 3. `NDatePicker` / `NTimePicker`

本地代码证据：

- 暴露 `to`
- 面板通过 `VFollower` 渲染
- 不具备与 `NSelect` 对等的 `menuProps` 路径

结论：

- 外层 wrapper 只能保护触发器
- 面板本身若需保护，不能只靠组件本体指令

推荐：

- 普通日期时间：只保护输入框触发器，通常足够
- 若面板内容本身也敏感：
  - 评估 `to=false`
  - 或使用专门 wrapper

默认不建议全局使用 `to=false`，避免引入 z-index、overflow、裁切问题。

### 4. `NUpload`

本地代码证据：

- `UploadFile` 内部保留文件名、缩略图、按钮、进度和预览行为
- `image-card` 预览链路最终走 `NImage -> NImagePreview`

结论：

- 上传流程按钮和状态本身可保留
- 文件内容、文件名、缩略图、附件预览必须单独治理

推荐：

- 上传按钮、进度、失败提示、重试按钮：`obscured`
- 文件名、缩略图、附件内容、电费单/证件图：`hidden`
- 高敏附件页面：
  - 优先禁用 preview
  - 或自定义 `onPreview`，不要走默认预览链路

### 5. `NImage` / `NImagePreview`

本地代码证据：

- `NImagePreview` 使用 `LazyTeleport`

结论：

- 外层 wrapper 无法自动覆盖预览层
- 敏感图片不适合仅用 `obscured`

推荐：

- 普通非敏感图片：可不处理或仅 `obscured`
- 敏感图片：
  - 缩略图：`hidden`
  - 预览：禁用

### 6. `NDataTable`

本地代码证据：

- 主表格是本地 DOM
- 列过滤菜单通过 `NPopover`

结论：

- 主表格可通过 wrapper 控制
- 过滤菜单不能只依赖表格外层 wrapper

推荐：

- 普通敏感文本表格：`obscured`
- 高敏整表：`hidden`
- 若筛选项敏感：
  - 使用自定义 `renderFilterMenu`
  - 在弹层根节点上单独加 replay 标记

## 业务事件与 Observability facade

### 领域事件归属

`upload_failure` 不属于 replay 私有层，应属于整个 observability / domain facade。

原因：

- 上传失败不是 replay 专属概念
- 同一事件应同时服务 replay、logs、trace 关联和后续 analytics
- 若绑定在 replay 层，会把业务错误模型与供应商实现耦合

### 推荐 schema

推荐最小字段：

- `module`
- `stage`
- `errorCode`
- `httpStatus`
- `traceId`
- `sessionId`
- `fileCategory`
- `sizeBucket`

明确不记录：

- 原始文件名
- 原始 OSS 链接
- 原始文件内容
- 原始签名参数

## 条件启用后的生产录制策略

以下策略仅适用于明确决定启用 replay 之后，不构成“当前阶段默认生产开启 replay”的建议。

### 推荐档位

当前系统推荐采用“平衡型”策略：

- 登录后启动 replay
- 仅关键业务模块录制
- 默认强脱敏
- 错误与用户反馈场景提级

### 录制范围

建议开启：

- 审批
- 合同/售电协议
- 工单
- 反馈问题后的排障页面

建议关闭：

- 登录
- OAuth 回调
- 验证码
- 纯后台配置页
- 明显高敏感个人信息采集页

### 采样

- 关键模块普通会话：`20%`
- 错误会话：`100%`
- 用户主动反馈问题：`100%`
- 非关键模块：`0%`

### 留存与权限

- replay 留存：`7 天`
- 排障期可临时升到 `14 天`
- 默认不超过 `14 天`
- 仅少量角色可查看：
  - 负责人
  - 少数排障开发
  - 必要运维/支持

## 风险与控制

### 风险 1：误以为组件本体上的指令能覆盖 teleport 浮层

控制：

- 明确区分 trigger/root 与 follower/teleport panel
- 通过 `menuProps` 或专门 wrapper 控制浮层

### 风险 2：上传和图片预览被误录

控制：

- 高敏图片默认 `hidden`
- 高敏场景禁用 preview
- Upload 仅保留流程按钮和错误状态，不保留敏感内容

### 风险 3：业务组件直接依赖 SDK

控制：

- 只允许依赖 observability facade
- 禁止业务模块直接导入 `@openreplay/tracker`

### 风险 4：长期保持全站常驻录制

控制：

- 登录后启动
- 路由白名单
- 采样与错误提级并用

## 实施建议

建议按以下顺序落地：

1. 抽离 `bootstrapObservability(app)`，把 replay 启停从 `main.ts` 直写升级为独立编排层。
2. 新增 `replay-privacy plugin`，注册 `v-replay-sanitize`。
3. 新增 `createReplayMenuProps(...)` 等 helper，先覆盖 Select 类组件。
4. 新增 `captureUploadFailure(...)` 等 observability facade。
5. 先从 `Upload / Image / Select / DataTable` 四类高风险区域开始治理。
6. 最后再切换生产采样、留存与权限策略。

## 为什么要这么做

综合本地代码事实、Vue 官方规则、OpenReplay 官方能力和主流 replay 产品实践，本设计的核心判断是：

1. replay 接入必须最小入侵，否则业务组件会被供应商 SDK 污染。
2. B 端敏感表单系统不适合“全站全量裸录”。
3. NaiveUI 复杂组件大量使用 follower / teleport / preview，不能只靠“给组件加指令”处理隐私边界。
4. 错误场景应以 observability 领域事件治理，而不是让 replay 成为业务错误模型的唯一出口。

## 参考资料

### 外部资料

- Vue custom directives
  - https://vuejs.org/guide/reusability/custom-directives.html
- OpenReplay SDK constructor
  - https://docs.openreplay.com/en/sdk/constructor/
- OpenReplay SDK methods
  - https://docs.openreplay.com/en/sdk/methods/
- OpenReplay sanitize data
  - https://docs.openreplay.com/en/installation/sanitize-data/
- OpenReplay private mode
  - https://docs.openreplay.com/en/sdk/private-mode/
- OpenReplay custom events tutorial
  - https://docs.openreplay.com/en/tutorials/custom-events
- Datadog Browser Session Replay privacy options
  - https://docs.datadoghq.com/session_replay/browser/privacy_options/
- Sentry Session Replay
  - https://docs.sentry.io/product/explore/session-replay/
- ICO cookies and similar technologies guidance
  - https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/
- NIST Privacy Engineering Program
  - https://www.nist.gov/privacy-engineering

### 本地代码依据

- `src/main.ts`
- `src/app/observability/index.ts`
- `src/app/observability/replay/openreplay.ts`
- `src/app/plugins/usePlugins.ts`
- `node_modules/naive-ui/es/select/src/Select.mjs`
- `node_modules/naive-ui/es/auto-complete/src/AutoComplete.mjs`
- `node_modules/naive-ui/es/tree-select/src/TreeSelect.mjs`
- `node_modules/naive-ui/es/cascader/src/Cascader.mjs`
- `node_modules/naive-ui/es/date-picker/src/DatePicker.mjs`
- `node_modules/naive-ui/es/date-picker/src/props.mjs`
- `node_modules/naive-ui/es/upload/src/Upload.mjs`
- `node_modules/naive-ui/es/upload/src/UploadFile.mjs`
- `node_modules/naive-ui/es/image/src/Image.mjs`
- `node_modules/naive-ui/es/image/src/ImagePreview.mjs`
- `node_modules/naive-ui/es/data-table/src/HeaderButton/FilterButton.mjs`

## 与其他文档的关系

- 部署、端口、同源 ingress、VM 运行栈：
  - 见 `docs/plans/completed/2026-04-15-openreplay-prod-like-deployment-design.md`
- frontend trace / replay 统一入口迁移：
  - 见 `docs/plans/completed/2026-04-14-frontend-observability-trace-replay-design.md`
- OpenReplay 环境变量与操作说明：
  - 见 `docs/how-to/operations/openreplay-setup.md`
