# Design Token Rationale

Status: active
Owner: frontend
Last verified: 2026-04-29
Source of truth:

- Code tokens: `src/app/presentation/theme/ThemeToken.ts`
- Naive UI bridge: `src/app/presentation/theme/hooks/useTheme.ts`
- Generated CSS: `src/app/presentation/theme/styles/generated-theme.css`
- Token contract reference: `docs/reference/design-system/design-token-spec.yaml`

## 结论

这套 token 的目标不是把所有 CSS 值都改成变量，而是把会跨页面、跨主题、跨组件重复出现的视觉决策抽出来，变成稳定契约。

当前分支已经从颜色、间距、字体、控件尺寸，扩展到 motion、layer、opacity、elevation 和 border。新增的几组 token 和原有规律一致：它们都不是某个页面的局部样式，而是 UI 系统里反复出现的基础能力。

后续新增 token 时，应先判断它是否满足三个条件：

1. 是否跨两个以上模块或组件重复出现。
2. 是否表达稳定语义，而不是某个实现细节。
3. 是否需要同时服务 CSS、Naive UI bridge、主题切换或设计交付。

如果不满足，优先留在局部组件样式里。

## 从一个颜色值开始

最早的 UI 样式通常从直接写值开始：

```css
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
}
```

这在单个页面里足够简单。问题出现在系统变大之后：同一个灰色会被复制到表格、卡片、弹窗、筛选区、菜单、标签里。某一天要调暗边框，开发者并不知道这几十个值哪些代表边框，哪些只是碰巧颜色相同。

这就是 primitive token 出现的原因。它先给原始值一个名字：

```text
color/primitive/slate-200 = #E2E8F0
spacing/16 = 1rem
```

primitive token 解决的是重复和追踪问题：值从散落在组件里，变成集中管理。但它还不能解决语义问题，因为 `slate-200` 只说明颜色，不说明用途。

## 从原始值到语义

当系统开始支持主题时，直接使用 `slate-200` 又会出问题。浅色主题里它可以是边框，深色主题里它可能太亮。组件真正关心的不是 `slate-200`，而是“默认边框”。

所以需要 semantic token：

```text
color/border/default
color/background/card
color/text/body
color/status/pending/text
```

语义 token 解决的是主题切换和设计意图问题。组件不再问“我要哪个色号”，而是问“我现在需要哪个角色”。浅色、深色、樱花主题可以给同一个角色不同实现。

当前项目里的 `semanticColorTokens` 就是这个层级。它让 work-order、approval、service-agreement 等模块不必理解每个主题内部的调色逻辑。

## 从颜色扩展到排版和密度

后台系统不是只靠颜色形成一致性。信息密度、行高、控件高度、表格行高同样会决定系统是否好用。

如果一个页面的输入框是 32px，另一个是 40px，表格行高有的 44px、有的 56px，用户会感受到界面不稳。开发侧也会不断在局部样式里修补对齐问题。

因此当前分支已经补了：

```text
font/size/body
font/weight/semibold
line-height/body
component/control/height/medium
component/table/row-height
component/navigation/item-height
```

这些 token 解决的是扫描效率和操作密度问题。它们把“后台系统应该紧凑但可读”的决策固定下来。

## 为什么还需要 motion

motion 不是装饰。它负责回答界面状态变化时的两个问题：

1. 变化是否让用户看得懂。
2. 变化是否让系统显得拖沓。

如果 hover 是 80ms，弹窗是 400ms，下拉是默认库值，用户会感觉交互节奏不一致。更现实的问题是，开发者会在不同组件里手写 transition，之后很难统一。

本次新增：

```text
motion/duration/fast = 120ms
motion/duration/base = 180ms
motion/duration/slow = 240ms
motion/easing/standard
motion/easing/enter
motion/easing/exit
motion/transition/base
```

它们解决的是交互节奏一致性。短反馈用 `fast`，常规状态切换用 `base`，较大浮层或布局变化用 `slow`。easing 统一后，进入、退出和普通状态变化不会各走各的曲线。

这个规律和颜色 token 一致：组件不应该随意发明一个“看起来还行”的动画曲线，而应该选择一个系统已有的交互语义。

## 为什么还需要 layer

后台系统经常同时出现固定表头、侧边栏、下拉、弹窗、通知、tooltip。没有 layer token 时，z-index 会变成局部竞赛：

```css
z-index: 999;
z-index: 10000;
z-index: 2147483647;
```

这类值一旦散落，后续很难判断谁应该压过谁。

本次新增：

```text
layer/sticky
layer/dropdown
layer/popover
layer/modal
layer/notification
layer/tooltip
layer/loading
```

它们解决的是叠层秩序问题。规则是从页面内元素到跨页面反馈逐级升高：sticky 低于 dropdown，dropdown 低于 popover，popover 低于 modal，notification 和 tooltip 位于更高层。

这个规律同样和 semantic color 一致：token 名称描述角色，不描述某个组件的偶然数值。

## 为什么还需要 opacity

disabled、loading、overlay、dragging 都会用到透明度。如果每个组件自己决定 `0.4`、`0.5`、`0.72`，状态强弱就会不一致。

本次新增：

```text
opacity/disabled
opacity/muted
opacity/overlay
opacity/loading
opacity/dragging
```

它们解决的是状态强度一致性。禁用态要弱，但不能不可读；遮罩要压低背景，但不能把上下文完全抹掉；loading 要表达暂时不可操作，但不应该像 disabled 一样表示权限或业务不可用。

这里的规律是：透明度 token 应该按“状态语义”命名，而不是按数值命名。不要新增 `opacity/50`，除非它真的是设计系统里的比例刻度；优先新增 `opacity/<state>`。

## 为什么还需要 elevation

项目原来已经有 `shadowSm`、`shadowMd`、`shadowLg`、`shadowXl`。这些值能用，但它们表达的是强弱，不表达用途。

本次新增的 elevation 语义层是：

```text
elevation/surface
elevation/card
elevation/floating
elevation/popover
elevation/modal
```

它解决的是空间层级问题。卡片、浮动控件、popover、modal 都可以使用阴影，但它们不应该随意选择 `shadowLg`。组件应该选择它在界面空间里的角色。

这和 `color/background/card` 的思想一致：不要让组件关心底层实现值，组件只声明自己是什么层级。

## 为什么还需要 border

border 不是一个颜色问题。真正的边框通常由宽度、样式和颜色共同构成：

```text
1px solid var(--color-border-default)
```

项目之前有边框颜色，也有大量 `1px solid ...` 拼接。这个写法短期可用，但会让 focus border、普通 border、status tag border 的宽度和样式各自漂移。

本次新增：

```text
border/width/default
border/width/focus
border/style/default
border/style/focus
border/focus-ring-width
```

它解决的是边框结构一致性。颜色仍然来自 color token，border token 负责边框自己的结构。`useTheme.ts` 里用 helper 组合它们，避免到处手写 `1px solid`。focus 宽度使用 `0.125rem`，保持等价于 2px 的视觉强度，同时符合项目新增尺寸值避免裸 px 的检查规则。

这个规律也和已有 token 一致：不同维度分开表达，再在 bridge 或组件里组合。

## 为什么要 bridge 到 Naive UI

token 只有定义还不够。项目实际 UI 大量来自 Naive UI，如果 token 不进入 `GlobalThemeOverrides`，业务组件仍然会看到两套视觉系统：

1. 本地 CSS 使用项目 token。
2. Naive UI 组件使用库默认 token。

这会造成按钮、弹窗、表格、下拉、通知看起来像来自不同系统。

因此当前实现做了两件事：

1. `ThemeToken.ts` 定义 token source of truth。
2. `useTheme.ts` 把 token 映射到 Naive UI bridge。

本次新增的 bridge 包括：

- `common.opacityDisabled`
- `common.boxShadow1/2/3`
- `common.cubicBezierEaseInOut/EaseOut/EaseIn`
- `Card.boxShadow`
- `Modal.boxShadow`
- `Popover.boxShadow`
- `Notification.boxShadow`
- `Select.menuBoxShadow`
- `Spin.opacitySpinning`
- status tag、select、pagination 的 border helper

这解决的是实现一致性。设计 token 不停留在文档，而是进入实际组件库。

## 为什么还要生成 CSS 变量

Naive UI bridge 覆盖的是组件库。业务组件、本地样式、Tailwind `@theme` 仍然需要 CSS 变量。

生成 `generated-theme.css` 的价值是：

1. 所有 token 能被 CSS 直接消费。
2. 主题切换时 `data-theme` 可以覆盖语义颜色。
3. 生成文件有 hash/meta，可以被 `pnpm check:generated` 检查漂移。

也就是说，生成 CSS 变量解决的是多消费端一致性问题。TypeScript、Naive UI 和 CSS 看到的是同一套 token。

## 新增 token 是否和原有规律一致

一致。

当前项目的规律可以概括为四层：

1. Primitive：原始值，例如 palette、spacing scale、shadow raw value。
2. Semantic：表达用途，例如 text、surface、status、elevation、opacity state。
3. Component：表达常见组件规格，例如 control height、table row height。
4. Bridge：把 token 投射到 Naive UI 和 CSS 变量。

这次新增的 token 没有打破这个层次：

- motion 是交互节奏语义。
- layer 是叠层秩序语义。
- opacity 是状态强度语义。
- elevation 是 shadow 的语义层。
- border 是边框结构语义。

它们都属于跨组件共享的设计决策，而不是某个页面的私有样式。

## 后续新增 token 的规则

新增 token 前先问四个问题：

1. 这个值是否已经在多个地方重复。
2. 这个值是否代表稳定设计意图。
3. 这个值是否需要跨主题、跨组件或跨技术栈同步。
4. 不加 token 是否会导致后续维护者继续复制硬编码值。

如果答案大多是“是”，可以新增 token。

如果只是某个组件的一次性布局，例如某个表单里的特殊 `margin-top`，不要新增 token。

## 命名规则

使用 `category/property/modifier`，必要时扩展为 `category/domain/property`。

推荐：

```text
color/status/pending/text
motion/duration/base
layer/modal
opacity/disabled
elevation/popover
border/width/default
component/table/row-height
```

避免：

```text
blueButtonColor
modalZIndex1200
opacity50
bigShadow
border1
```

好的 token 名称应该让人知道“什么时候用”，而不只是知道“值是多少”。

## 新增 token 的落地步骤

每次新增 token，按这个顺序做：

1. 在 `ThemeToken.ts` 增加 source-of-truth。
2. 在 `ThemeToken.spec.ts` 增加存在性和关键值测试。
3. 如果 CSS 需要消费，在 `ThemeGeneratorVitePlugin.ts` 追加输出。
4. 如果 Naive UI 需要消费，在 `useTheme.ts` bridge 到对应 override。
5. 如果 bridge 行为变化，在 `useTheme.spec.ts` 增加断言。
6. 重新生成 `generated-theme.css` 和 meta。
7. 运行 `pnpm test:unit --run "src/app/presentation/theme" "vite-plugin/__tests__/ThemeGeneratorVitePlugin.spec.ts"`。
8. 运行 `pnpm check`。
9. 更新相关文档或索引。

## 不建议现在做的事情

不要为了追求完整而立即建立巨大组件 token 表，例如：

```text
button/primary/default/background
button/primary/hover/background
button/primary/pressed/background
input/default/border
input/focus/border
modal/header/title/font-size
```

除非这些状态已经在多个组件或业务模块里反复出现，否则它会让 token 系统变成另一个样式表。当前项目更适合先保留“基础语义 + 常用组件规格 + bridge”的层次。

## 外部参考

- W3C Design Tokens Community Group, Design Tokens Format Module
  https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/
- Atlassian Design System, Design tokens
  https://atlassian.design/foundations/tokens/design-tokens/
- IBM Carbon Design System, Design tokens and motion guidance
  https://carbondesignsystem.com/
- SAP Fiori, Design Tokens
  https://www.sap.com/design-system/fiori-design-web/foundations/visual/design-tokens
- Esri Calcite Design System, Token usage
  https://developers.arcgis.com/calcite-design-system/foundations/tokens/usage/
