# Captcha Agent Notes

## Entry Points

- `application/service.ts`
- `application/hooks/useCaptcha`
- `application/hooks/useSMS`

## Local Commands

- `pnpm test:unit --run`

## Boundaries

- 模块保持小而单一，只处理图形验证码和短信验证码。
- 冷却与本地持久化语义只放在 `useSMS`，不要上提到 `shared`。
- 外部模块通过 service 或 hooks 访问，不直接引用 infrastructure。

## High-Risk Changes

- `useSMS` 的 Dexie 冷却逻辑
- 新增验证码类型时的分层一致性

## Related Source-Of-Truth Docs

- `../../../docs/index.md`
