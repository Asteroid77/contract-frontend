# Service-Agreement Agent Notes

## Entry Points

- `application/service.ts`
- `application/validation.ts`
- `application/mappers.ts`
- `presentation/sign/`

## Local Commands

- `pnpm test:unit --run`

## Boundaries

- 备案与签约是两套状态规则，校验和 DTO 清洗必须同时看。
- 只允许限定的跨模块类型依赖：`file` 的回调类型和 `approval` 的审批实例类型。
- 该模块是叶子模块，不向其他业务模块导出业务服务。

## High-Risk Changes

- 双状态表单校验
- `cleaners.ts` / `mappers.ts`
- 签约触发审批链路

## Related Source-Of-Truth Docs

- `README.md`
- `../../../docs/index.md`
