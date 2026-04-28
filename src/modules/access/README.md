# Access Module

`access` 负责两件核心事情：令牌生命周期管理，以及基于 CASL 的权限能力装配。只要改动涉及登录态、refresh、跨 tab 会话恢复或权限渲染，都应先从这里进入。

## Key Entry Points

- `application/token-manager.ts`: refresh、重放、跨 tab 锁与失败退避
- `application/ability.ts`: Ability 构建与权限字符串映射
- `application/hooks/useCan.ts`: 页面层的权限判断入口
- `presentation/directives/can.ts`: 模板层 `v-can`

## Boundaries

- 其他模块不要重复实现 refresh 或权限缓存逻辑。
- 对外消费优先走模块导出面，避免新增内部路径耦合。
- 修改权限字符串或 subject 映射时必须同步核对后端契约。

## Related Docs

- `../../../docs/explanation/modules/access/request-auth-refresh.md`
- `../../../docs/how-to/modules/access/casl-integration.md`
