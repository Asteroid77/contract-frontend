# captcha 模块 Agent 指令

## 全局规则引用

本模块内改动仍以本模块边界与分层规则为先；但 UI（discrete / theme）、文案（i18n）与搜索（advanced_query，`ModernQueryBuilder`）规则统一遵循 `Rule.md`。

## 定位

`src/modules/captcha` 是验证码业务模块，负责图形验证码获取和短信验证码发送。模块体量小、职责单一，主要服务于登录/注册等认证流程。

## 目录与职责

```
captcha/
├── domain/           # 领域类型（ImageCaptchaResponse, SmsCaptchaResponse）
├── application/      # 应用层
│   ├── service.ts    # 验证码服务（getCaptcha, sendSmsCode）
│   ├── models.ts     # 应用层类型别名
│   └── hooks/        # Vue 组合式函数（useCaptcha, useSMS）
└── infrastructure/   # 仓储实现（captchaRepository, API 调用）
```

## 依赖约束

### 允许

- captcha/infrastructure 可依赖 `@/modules/shared/infrastructure`（useRequest, API 前缀生成）。
- captcha/application/hooks 可依赖 `@tanstack/vue-query`、`@/app/infrastructure`（查询上下文、Dexie 存储）。
- captcha/domain 仅导出纯 TypeScript 类型，无外部依赖。

### 禁止

- captcha 禁止 `import` 其他业务模块（`@/modules/contract`、`@/modules/access` 等）。
- captcha/domain 禁止依赖 infrastructure、application、任何框架实现。
- 其他业务模块使用 captcha 时，只能通过 `application/hooks` 或 `application/service` 访问，不要直接引用 infrastructure。

## 修改本模块的规则

1. 本模块结构已稳定，新增验证码类型（如邮箱验证码）应遵循现有分层：domain 定义类型，infrastructure 实现 API 调用，application 暴露 service 和 hook。
2. `useSMS` 内部维护了基于 IndexedDB (Dexie) 的发送冷却计时，修改冷却逻辑时注意清理定时器和存储记录。
3. 改动后运行 `pnpm test:unit` 验证，相关测试位于各层的 `__tests__/` 目录。
4. 不要把 captcha 专用逻辑上提到 shared 模块。
