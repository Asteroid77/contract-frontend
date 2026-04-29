# Agent Guide

## Governance Upstream

- Upstream: `/home/meteor/DEV/projects/test/engineering-governance`
- Version: `local-working-tree (2026-04-20)`
- Local governance entry:
  - `docs/governance/README.md`
- Local overrides:
  - UI 文案、错误反馈、权限边界、请求链路、可观测性策略、CSP/安全策略变更，必须同步更新对应文档与检查命令。
  - 保留现有未提交改动，不回滚不相关文件；若发现冲突，先厘清责任边界后再改。
  - 本仓库仅保留 `docs/governance/README.md` 作为本地治理入口；共享治理模板、policies 与 lifecycle 直接以上游仓库为准。

本仓库默认遵循上游共享治理规则。此文件只保留仓库特有上下文与显式本地覆盖，不再复制完整共享治理文本。

## Repository Goal

维护合同管理系统前端应用，包括认证与权限、审批、售电协议、工单、共享组件、视图路由、主题体系与前端观测能力。

## Local Working Rules

- Follow upstream governance by default.
- Do not duplicate upstream shared policies in this file.
- Record only repository-specific differences here.
- When creating a worktree for this repository, copy required ignored `.env*` files from the source workspace before local verification. Keep those files ignored and do not commit them.
- After creating a worktree for this repository, run `pnpm install --frozen-lockfile` to restore dependencies before checks; use plain `pnpm install` only when intentionally updating dependency metadata.

## Critical Commands

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm test:unit --run
pnpm build
```

## Verification Standard

- 优先运行与改动直接相关的最小验证，再补齐仓库级检查。
- 能用脚本或命令证明的约束，不要只靠人工描述保证。
- 如果验证只覆盖局部范围，必须明确说明验证边界，不能外推为整体完成。

## Directory Map

- `src/app/`: 应用装配、主题、插件、基础设施
- `src/modules/`: 业务模块与 shared 模块
- `src/views/`: 页面级视图与路由入口
- `docs/`: 仓库文档入口与知识库
- `scripts/`: 校验、生成、发布辅助脚本

## High-Risk Areas

- `src/modules/access`: token、refresh、权限与会话恢复
- `src/modules/shared`: 公共请求层、通用组件、跨模块公共能力
- `src/app/presentation/theme`: 主题 token、全局样式与设计令牌
- `src/router`、`src/views`: 路由、页面入口与导航守卫
- `src/app/infrastructure`、`src/modules/observability`: 观测、上报、安全策略与跨环境装配

## Source Of Truth Docs

- Governance upstream: `/home/meteor/DEV/projects/test/engineering-governance`
- Local governance entry: `docs/governance/README.md`
- Repository entry: `README.md`
- Documentation index: `docs/index.md`
- Contribution rules: `CONTRIBUTING.md`
- Active plans: `docs/plans/active/`
- Completed plans / decisions: `docs/plans/completed/`
