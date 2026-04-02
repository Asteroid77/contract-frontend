# shared 模块 Agent 指令

## 定位

`src/modules/shared` 是跨业务模块的公共基础层。它提供通用类型、工具函数和 UI 组件，供所有业务模块复用。本模块本身不包含任何业务逻辑。

## 目录与职责

```
shared/
├── domain/           # 通用领域类型（响应体、分页、查询、错误）
├── application/      # 应用层工具（映射、表单、校验规则、常量、请求类型）
├── infrastructure/   # 请求封装（useRequest）、API 前缀生成
├── presentation/     # 通用 UI 组件（widget/）、查找表、时间格式化、diff 对比、工具函数
```

## 依赖约束

### 允许

- 业务模块 `import` shared 下的任何导出。
- shared/infrastructure 可依赖 `@/app/infrastructure`（HTTP 客户端、请求上下文）。
- shared/infrastructure 可依赖 `@/modules/access/application/token-manager`（认证令牌）。
- shared/presentation 可依赖第三方 UI 库（Naive UI）和 dayjs。

### 禁止

- shared 禁止 `import` 任何业务模块（`@/modules/contract`、`@/modules/access` 等），token-manager 除外（已有历史耦合）。
- shared/domain 禁止依赖 infrastructure、presentation、任何框架实现。
- 业务模块之间禁止通过 shared 间接传递业务状态。

## 关键导出

| 层             | 文件/目录                     | 说明                                                            |
| -------------- | ----------------------------- | --------------------------------------------------------------- |
| domain         | `response.ts`                 | `RFC7807Response`、`RFC7807SuccessResponse` 统一响应类型        |
| domain         | `errors.ts`                   | `BusinessError` 业务异常类                                      |
| domain         | `page.ts`                     | `IPage`、`BasePageRequest` 分页类型                             |
| domain         | `query.ts`                    | `FilterOp`、`QueryGroup`、`QueryFilters` 查询过滤               |
| domain         | `advanced-query/`             | 高级查询类型与常量                                              |
| application    | `mapper-utils.ts`             | DTO 映射工具（trimString、toTimestampOrNull 等）                |
| application    | `rules/`                      | 表单校验规则（手机号、必填）                                    |
| application    | `constants/`                  | 银行、行业、省市区等静态数据                                    |
| application    | `form/`                       | `useSubscribeForm` 表单订阅 hook                                |
| application    | `request/types.ts`            | `CustomAxiosRequestConfig` 请求配置扩展                         |
| infrastructure | `useRequest.ts`               | 统一请求函数（自动解包、401 重试、requestId 注入）              |
| infrastructure | `api/api-prefix-generator.ts` | API 路径前缀生成                                                |
| presentation   | `widget/`                     | 通用组件：AppFormItem、CrudSelect、SearchLayout、PCACascader 等 |
| presentation   | `lookup.ts`                   | `SelectLookup`、`TreeLookup` 查找表                             |
| presentation   | `time/`                       | 时间格式化（标准、相对、本地化）                                |
| presentation   | `diff-check/`                 | 数据变更对比组件                                                |
| presentation   | `utils.ts`                    | 树搜索、CSS 提取、对象对比等工具                                |

## UI 决策表

各业务模块在 presentation 层实现 UI 时，必须遵循以下决策。违反这些规则会导致主题不一致、国际化遗漏或组件碎片化。

| 场景 | 正确做法 | 错误做法 | 参考文件 |
| --- | --- | --- | --- |
| **消息/对话框/通知** | 使用 `@/_utils/discrete_naive_api` 导出的 `message`、`dialog`、`notification` 等 discrete wrapper | 直接调用 `window.$message`、`window.$dialog` 或手动 `createDiscreteApi` | `src/_utils/discrete_naive_api/index.ts` |
| **用户可见文案** | 使用 `$t('key')` 或 `useI18n()` 获取翻译文本，key 按 `_utils/i18n/NAMING_CONVENTION.md` 规范命名 | 硬编码中文/英文字符串（如 `'提交成功'`、`'Submit'`） | `src/_utils/i18n/index.ts`, `src/_utils/i18n/NAMING_CONVENTION.md` |
| **颜色与样式** | 使用 `ThemeToken` 导出的语义化 token 或对应 CSS 变量（如 `--primary`、`--bg-card`），间距使用 `commonTokens`（如 `spacingMd`、`paddingCard`） | 硬编码 hex/rgb 色值（如 `#334155`、`rgb(51,65,85)`）或魔法数字间距（如 `padding: 17px`） | `src/app/presentation/theme/ThemeToken.ts`, `src/app/presentation/theme/hooks/useTheme.ts` |
| **搜索与筛选** | 使用 `ModernQueryBuilder` 组件 + `QueryFilters` 类型构建查询条件 | 手写简单 `<input>` 搜索框或自行拼接查询参数对象 | `src/modules/shared/presentation/advanced-query/modern/ModernQueryBuilder.tsx`, `src/modules/shared/domain/query.ts` |

### 补充说明

- **discrete wrapper 存在的原因**：Naive UI 的 discrete API 需要传入当前主题配置才能正确渲染。`discrete_naive_api` 已与 `useTheme` 联动，直接 `import { message } from '@/_utils/discrete_naive_api'` 即可获得主题感知的消息提示。绕过它会导致暗色模式下弹窗样式错乱。
- **i18n 覆盖范围**：所有用户可见文案都需要走 `$t`，包括表单 label、placeholder、校验提示、按钮文字、空状态描述。仅开发日志和 `console` 输出可以使用英文硬编码。
- **theme token 优先级**：语义化 token（`primary`、`bgCard`、`textBody`）> Naive UI 内置变量 > 原始色值。如果 `ThemeToken.ts` 中没有合适的 token，先评估是否应该新增 token，而不是直接写死色值。
- **ModernQueryBuilder 适用场景**：任何需要多条件筛选的列表页。简单的单字段搜索（如顶部全局搜索）不在此约束范围内。

## 修改本模块的规则

1. 新增导出必须是"多个业务模块都需要"的通用能力，单一模块专用的放在该业务模块内。
2. 不要在 domain 层引入框架依赖（Vue、axios、Naive UI）。
3. 修改 `useRequest` 或 `BusinessError` 时需评估对所有业务模块的影响。
4. 每个子目录下的 `__tests__/` 包含对应单元测试，改动后运行 `pnpm test:unit` 验证。
