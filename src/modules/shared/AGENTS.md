# Shared Agent Notes

## Entry Points

- `infrastructure/useRequest.ts`
- `domain/errors.ts`
- `presentation/widget/`
- `presentation/advanced-query/`

## Local Commands

- `pnpm test:unit --run`
- `pnpm type-check`

## Boundaries

- shared 只放跨模块公共能力，不承载业务状态。
- `useRequest`、`BusinessError`、高级查询与公共组件变更会扩散到全仓。
- 保持 `domain` 纯净，不继续扩大对业务模块的反向依赖。

## High-Risk Changes

- `useRequest.ts`
- `BusinessError`
- 公共 UI 组件和高级查询

## Related Source-Of-Truth Docs

- `../../../docs/index.md`
