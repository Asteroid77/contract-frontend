# Service-Agreement Module

`service-agreement` 负责售电协议的备案与签约流程，包括表单、附件、审批发起、打印和差异对比。这是一个叶子业务模块，重点风险在双状态规则和 DTO 映射。

## Key Entry Points

- `application/service.ts`
- `application/validation.ts`
- `application/mappers.ts`
- `presentation/sign/`

## Boundaries

- 备案与签约是两套校验规则，改动时必须一起核对。
- `cleaners.ts` 和 `mappers.ts` 决定提交与回显语义。
- 允许的跨模块依赖只限 `file` 回调类型和 `approval` 审批实例类型。

## Related Docs

- `../../../docs/index.md`
