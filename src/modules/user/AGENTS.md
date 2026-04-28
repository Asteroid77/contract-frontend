# User Agent Notes

## Entry Points

- `application/service.ts`
- `application/totp-service.ts`
- `application/stores/useAccountStore.ts`
- `presentation/login/`

## Local Commands

- `pnpm test:unit --run`

## Boundaries

- `useAccountStore` 是全局登录态唯一入口，外部不要绕开它管理账号状态。
- 视图模型变化要同步更新 `mappers.ts`。
- 表单校验集中在 `application/validation.ts`，不要在页面层散落规则。

## High-Risk Changes

- `useAccountStore.ts`
- 登录 / OAuth2 / TOTP 流程
- user 与 access 的认证耦合

## Related Source-Of-Truth Docs

- `../../../docs/index.md`
