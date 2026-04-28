# Contributing

## Scope

本仓库接收前端应用、前端测试、前端构建与前端文档治理相关的改动。

## Before You Change Anything

- 先阅读 `README.md`、`AGENTS.md`、`docs/index.md`
- 优先沿用现有模块边界、主题体系、请求链路和测试约定
- 不要顺手处理与当前任务无关的现有未提交改动

## Development Workflow

1. 在隔离分支上工作
2. 先理解模块边界，再做最小改动
3. 行为、交互、请求契约或文档结构变化时同步更新文档
4. 提交前运行最小必要验证

## Validation

推荐至少执行：

```bash
bash ./scripts/check-docs.sh
pnpm check
pnpm test:unit --run
pnpm build
```

## Documentation Rules

- 根级 `README.md` 只做项目入口
- 根级 `AGENTS.md` 只做地图与高风险提示
- 文档先按用途分层，再按模块做子分类
- 不在 `src/modules/**` 下新建 `docs/`
- 模块级 `AGENTS.md` 只保留局部约束，不复制全局规则

## Pull Requests

- 在 PR 描述中写清楚范围、风险、验证与文档影响
- 使用仓库 PR 模板
- 如果没有文档影响，也要显式勾选 `no doc impact`
