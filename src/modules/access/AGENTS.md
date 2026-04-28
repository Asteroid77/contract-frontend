# Access Agent Notes

## Entry Points

- `application/token-manager.ts`
- `application/ability.ts`
- `application/hooks/useCan.ts`
- `presentation/directives/can.ts`

## Local Commands

- `pnpm test:unit --run`

## Boundaries

- `token-manager.ts` 负责 refresh、重放、跨 tab 锁与失败退避，其他模块不要重复实现。
- 对外消费优先走本模块导出面，不继续扩大对内部路径和 `user` 模块的耦合。
- `ability.ts` 的权限字符串与 subject 枚举必须和后端保持一致。

## High-Risk Changes

- `token-manager.ts`
- `ability.ts`
- 与 `shared/infrastructure/useRequest` 的认证耦合

## Related Source-Of-Truth Docs

- `README.md`
- `../../../docs/explanation/modules/access/request-auth-refresh.md`
- `../../../docs/how-to/modules/access/casl-integration.md`
