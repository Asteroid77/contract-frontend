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

## 全局Hard规则（LLM 执行）

- R1（discrete）: 非组件上下文的消息/弹窗 MUST 走 `src/_utils/discrete_naive_api/index.ts`；MUST NOT 直接调用组件上下文 API。
- R2（i18n）: 所有用户可见文案 MUST 使用 `$t` 或 `useI18n`；MUST NOT 硬编码可见文本。
- R3（theme）: 颜色与主要样式值 MUST 优先使用 theme token 或 CSS 变量；MUST NOT 在业务代码硬编码主样式值。
- R4（advanced_query）: 搜索筛选 MUST 使用 `ModernQueryBuilder + QueryFilters`（参考 `advanced_query`）；MUST NOT 新增绕过该模式的筛选实现。
- R5 (time): 时间格式的处理参考`src/modules/shared/presentation/time/index.ts`；MUST NOT 自行实现重复功能。
- R6（casl）：权限相关的处理参考`docs/CASL_INTEGRATION.md`；MUST NOT自行实现。
- R7（tanstack query）：请求相关需要根据业务评估是否实现缓存以及缓存的时间，请求后会返回服务器的应答toast（参考`src/app/plugins/useRequestPlugin.ts#globalSuccessHandler以及globalBaseErrorHandler`），所以对于请求后需要提示成功/失败的内容，MUST NOT额外做toast/message。
